"use client";

import { useCallback, useRef, useState } from "react";
import { Heart, Plus } from "lucide-react";
import { AddPrescriptionDialog } from "@/components/add-prescription-dialog";
import { AdherenceCard } from "@/components/adherence-card";
import { DoseCard } from "@/components/dose-card";
import { InventoryCard } from "@/components/inventory-card";
import { RefillCard } from "@/components/refill-card";
import { SiteHeader } from "@/components/site-header";
import { Toast } from "@/components/toast";
import { WellnessCard } from "@/components/wellness-card";
import { INITIAL_DOSES, type Dose, type ToastMessage } from "@/lib/data";

export function Dashboard() {
  const [doses, setDoses] = useState<Dose[]>(INITIAL_DOSES);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
  }, []);

  const closeToast = useCallback(() => setToast(null), []);
  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    window.requestAnimationFrame(() => addButtonRef.current?.focus());
  }, []);

  function markDoseDone(id: string) {
    const dose = doses.find((item) => item.id === id);
    if (!dose) return;

    const takenAt = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    setDoses((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: "taken", takenAt } : item,
      ),
    );
    showToast(`${dose.name} ${dose.dosage} marked as taken.`);
  }

  function addPrescription(dose: Dose) {
    setDoses((current) =>
      [...current, dose].sort((a, b) => a.time.localeCompare(b.time)),
    );
    showToast(`Prescription for ${dose.name} added to today's schedule.`);
  }

  function orderAllRefills() {
    showToast("Refill request sent for all three medications.");
  }

  return (
    <>
      <a className="skip-link" href="#overview">
        Skip to dashboard
      </a>

      <div className="app-frame" inert={dialogOpen}>
        <SiteHeader />

        <main className="dashboard-main" id="overview">
          <div className="hero">
            <div className="hero-copy">
              <p className="eyebrow">
                <Heart size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                <span>Daily Living</span>
                <span className="eyebrow-dot" aria-hidden="true">
                  &bull;
                </span>
                <span>Family Overview</span>
              </p>
              <h1>Grandma Jeanne Today</h1>
              <p className="hero-subtitle">
                Wednesday, October 16
                <span aria-hidden="true">&bull;</span>
                Real-time synchronized log with home care nurses
              </p>
            </div>

            <button
              type="button"
              ref={addButtonRef}
              className="primary-button hero-button"
              onClick={() => setDialogOpen(true)}
            >
              <span className="button-plus" aria-hidden="true">
                <Plus size={14} strokeWidth={2.8} />
              </span>
              Add a Prescription
            </button>
          </div>

          <div className="dashboard-grid">
            <div className="main-column">
              <DoseCard doses={doses} onMarkDone={markDoseDone} />
              <AdherenceCard />
            </div>

            <aside className="side-column" aria-label="Refills, stock, and wellness">
              <RefillCard onNotify={showToast} />
              <InventoryCard onOrderAll={orderAllRefills} />
              <WellnessCard />
            </aside>
          </div>
        </main>
      </div>

      <AddPrescriptionDialog
        open={dialogOpen}
        onClose={closeDialog}
        onAdd={addPrescription}
      />

      {toast ? <Toast key={toast.id} toast={toast} onDismiss={closeToast} /> : null}
    </>
  );
}