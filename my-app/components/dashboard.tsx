"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { AdherenceCard } from "@/components/adherence-card";
import { AppNav } from "@/components/AppNav";
import { DoseCard } from "@/components/dose-card";
import { InventoryCard } from "@/components/inventory-card";
import { RefillCard } from "@/components/refill-card";
import { Toast } from "@/components/toast";
import {
  completeRefill,
  getFamilyDashboard,
  planRefill,
  subscribeToPatientEvents,
  type ApiAdherence,
  type ApiCareCircleDose,
  type ApiCareCircleToday,
  type ApiFamilyMember,
  type ApiStockItem,
} from "@/lib/api";
import { toStockItem, type Dose, type ToastMessage } from "@/lib/data";
import { readProfile } from "@/lib/profile";

// Changes arrive instantly through server events; this slower refresh is a
// fallback in case the event stream drops.
const REFRESH_MS = 60_000;

const PERIODS: Record<ApiCareCircleDose["timeOfDay"], string> = {
  MORNING: "Morning",
  MIDDAY: "Lunch",
  EVENING: "Evening",
  BEDTIME: "Bedtime",
};

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

// Family members only follow Jeanne's doses: taken (and when), pending, or
// missed (snoozed 3 times without taking it, or never taken that day).
// Doses are confirmed by Jeanne on her own screen.
function toDose(dose: ApiCareCircleDose): Dose {
  return {
    id: String(dose.id),
    time: dose.time,
    period: PERIODS[dose.timeOfDay],
    name: dose.medication,
    dosage: dose.dosage,
    instructions: [dose.instruction, dose.mealInstruction].filter(Boolean).join(" · "),
    status: dose.status === "TAKEN" ? "taken" : dose.status === "MISSED" ? "missed" : "pending",
    takenAt: dose.takenAt ? formatClock(dose.takenAt) : undefined,
    takenBy: dose.takenBy ?? undefined,
  };
}

/** The family member using this screen, from the profile picked at sign-in. */
function currentMember(members: ApiFamilyMember[]) {
  const profile = readProfile();
  return (
    members.find((member) => member.firstName.toLowerCase() === profile) ??
    members.find((member) => member.isPrimaryCaregiver) ??
    members[0]
  );
}

export function Dashboard() {
  const [today, setToday] = useState<ApiCareCircleToday | null>(null);
  const [stock, setStock] = useState<ApiStockItem[]>([]);
  const [adherence, setAdherence] = useState<ApiAdherence | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
  }, []);
  const closeToast = useCallback(() => setToast(null), []);

  const refresh = useCallback(async () => {
    try {
      const data = await getFamilyDashboard(7);
      setToday(data.today);
      setStock(data.stock);
      setAdherence(data.adherence);
      setError(null);
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, []);

  useEffect(() => {
    // Initial load and polling both go through refresh(); state updates happen after the await.
    const first = window.setTimeout(refresh, 0);
    const interval = window.setInterval(refresh, REFRESH_MS);
    // Jeanne's confirmations and other family members' actions show up at once.
    const unsubscribe = subscribeToPatientEvents(refresh);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
      unsubscribe();
    };
  }, [refresh]);

  const now = new Date();
  const doses = today?.doses.map(toDose) ?? [];
  const member = today ? currentMember(today.members) : undefined;
  const patientName = today?.patient.firstName ?? "Jeanne";
  const dateLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  // One alert per low-stock medication (10 doses or fewer), most urgent first.
  const lowStock = stock
    .filter((item) => item.isLow)
    .sort((a, b) => a.stockDoses - b.stockDoses);

  async function handlePickedUp(refillId: number, name: string, boxDoses: number) {
    try {
      await completeRefill(refillId, boxDoses);
      showToast(`${name} restocked with ${boxDoses} doses.`);
      await refresh();
    } catch (caught) {
      showToast((caught as Error).message);
    }
  }

  async function handleRefill(medicationId: number, plannedFor: string) {
    if (!member) return;
    try {
      await planRefill(medicationId, member.id, plannedFor);
      showToast(`Thanks! Everyone, including ${patientName}, can see you are handling it.`);
      await refresh();
    } catch (caught) {
      showToast((caught as Error).message);
    }
  }

  return (
    <>
      <a className="skip-link" href="#overview">
        Skip to dashboard
      </a>

      <AppNav />

      <main className="dashboard-main family-dashboard" id="overview">
        <div className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <Heart size={14} fill="currentColor" strokeWidth={0} aria-hidden="true" />
              <span>Daily Living</span>
              <span className="eyebrow-dot" aria-hidden="true">
                &bull;
              </span>
              <span>Family Overview</span>
            </p>
            <h1>Grandma {patientName} Today</h1>
            <p className="hero-subtitle">
              {dateLabel}
              <span aria-hidden="true">&bull;</span>
              Updates live when {patientName} confirms a dose
            </p>
          </div>

          <Link href="/prescriptions" className="primary-button hero-button">
            <span className="button-plus" aria-hidden="true">
              <Plus size={16} strokeWidth={2.8} />
            </span>
            Add a Prescription
          </Link>
        </div>

        {error ? (
          <p className="dashboard-error" role="alert">
            Could not reach the MamieMedoc server: {error}
          </p>
        ) : null}

        <div className="dashboard-grid">
          <div className="main-column">
            <DoseCard doses={doses} patientName={patientName} loading={!today} />
            <AdherenceCard adherence={adherence} />
          </div>

          <aside className="side-column" aria-label="Refills and stock">
            {lowStock.map((item) => (
              <RefillCard
                key={item.medicationId}
                item={item}
                patientName={patientName}
                onPlan={handleRefill}
                onPickedUp={handlePickedUp}
              />
            ))}
            <InventoryCard items={stock.map(toStockItem)} />
          </aside>
        </div>
      </main>

      {toast ? <Toast key={toast.id} toast={toast} onDismiss={closeToast} /> : null}
    </>
  );
}
