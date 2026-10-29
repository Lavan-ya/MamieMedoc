"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Archive,
  CheckCheck,
  Inbox,
  MonitorSmartphone,
  RotateCcw,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import { CurrentMedications } from "@/components/current-medications";
import { MedicationVerifyCard } from "@/components/medication-verify-card";
import { PillboxCoverageCard } from "@/components/pillbox-coverage-card";
import { PrescriptionUploadCard } from "@/components/prescription-upload-card";
import { ScanResultCard } from "@/components/scan-result-card";
import { Toast } from "@/components/toast";
import {
  confirmPrescription,
  discardPrescription,
  getStock,
  listDraftPrescriptions,
  listMedications,
  scanPrescription,
  type ApiCurrentMedication,
  type ApiPrescription,
  type ApiStockItem,
} from "@/lib/api";
import {
  daysOfStock,
  toDetectedMedication,
  toPrescriptionScan,
  toTimeOfDay,
  type DetectedMedication,
  type IntakeSlot,
  type PrescriptionScan,
  type ToastMessage,
} from "@/lib/data";

type Draft = {
  scan: PrescriptionScan;
  medications: DetectedMedication[];
};

function toDraft(prescription: ApiPrescription, fileName?: string): Draft {
  return {
    scan: toPrescriptionScan(prescription, fileName),
    medications: prescription.medications.map(toDetectedMedication),
  };
}

export function PrescriptionReview() {
  // The prescription waiting for review; null once it has been confirmed.
  const [draft, setDraft] = useState<Draft | null>(null);
  const [stock, setStock] = useState<ApiStockItem[]>([]);
  const [current, setCurrent] = useState<ApiCurrentMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"scanning" | "saving" | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const browseRef = useRef<HTMLButtonElement>(null);

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
  }, []);
  const closeToast = useCallback(() => setToast(null), []);

  // Stock and the current medication list change together (confirm, edit, stop).
  const refreshSchedule = useCallback(async () => {
    const [stockItems, medications] = await Promise.all([getStock(), listMedications()]);
    setStock(stockItems);
    setCurrent(medications);
  }, []);

  const handleScheduleChanged = useCallback(
    (message: string) => {
      showToast(message);
      refreshSchedule().catch((error: Error) => showToast(error.message));
    },
    [refreshSchedule, showToast],
  );

  // Resume the latest unreviewed scan, if any, and load home stock.
  useEffect(() => {
    let ignore = false;
    Promise.all([listDraftPrescriptions(), getStock(), listMedications()])
      .then(([drafts, stockItems, medications]) => {
        if (ignore) return;
        setDraft(drafts[0] ? toDraft(drafts[0]) : null);
        setStock(stockItems);
        setCurrent(medications);
      })
      .catch((error: Error) => {
        if (!ignore) showToast(`Could not reach the MamieMedoc server: ${error.message}`);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [showToast]);

  function updateMedication(id: string, change: (item: DetectedMedication) => DetectedMedication) {
    setDraft((current) =>
      current && {
        ...current,
        medications: current.medications.map((item) => (item.id === id ? change(item) : item)),
      },
    );
  }

  function toggleSlot(id: string, slot: IntakeSlot) {
    updateMedication(id, (item) => ({
      ...item,
      schedule: item.schedule.includes(slot)
        ? item.schedule.filter((value) => value !== slot)
        : [...item.schedule, slot],
    }));
  }

  function changeTime(id: string, slot: IntakeSlot, time: string) {
    updateMedication(id, (item) => ({ ...item, times: { ...item.times, [slot]: time } }));
  }

  function toggleAlert(id: string) {
    updateMedication(id, (item) => ({ ...item, alertEnabled: !item.alertEnabled }));
  }

  async function removeMedication(id: string) {
    if (!draft) return;
    const medication = draft.medications.find((item) => item.id === id);
    if (!medication) return;

    // Removing the last medication leaves nothing to save: discard the whole scan.
    if (draft.medications.length === 1) {
      if (!window.confirm(`Remove ${medication.name}? This is the last medication, so the whole scan will be discarded.`)) {
        return;
      }
      setBusy("saving");
      try {
        await discardPrescription(draft.scan.id);
        setDraft(null);
        showToast("Prescription discarded.");
      } catch (error) {
        showToast((error as Error).message);
      } finally {
        setBusy(null);
      }
      return;
    }

    if (!window.confirm(`Remove ${medication.name} ${medication.strength} from this prescription?`)) return;
    // Medications left out of the confirm request are deleted by the API.
    setDraft({ ...draft, medications: draft.medications.filter((item) => item.id !== id) });
    showToast(`${medication.name} removed. It will not be added to Jeanne's schedule.`);
  }

  async function handleFile(file: File) {
    setBusy("scanning");
    try {
      // A new scan replaces the one currently under review.
      if (draft) await discardPrescription(draft.scan.id);
      const prescription = await scanPrescription(file);
      setDraft(toDraft(prescription, file.name));
      showToast(`${file.name} scanned. Please verify the detected medications.`);
    } catch (error) {
      showToast((error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  function retake() {
    document.getElementById("upload")?.scrollIntoView({ behavior: "smooth", block: "start" });
    browseRef.current?.focus({ preventScroll: true });
  }

  async function confirmSchedule() {
    if (!draft) return;
    const unscheduled = draft.medications.filter((item) => item.schedule.length === 0);
    if (unscheduled.length > 0) {
      showToast(`Choose at least one intake time for ${unscheduled.map((item) => item.name).join(", ")}.`);
      return;
    }

    setBusy("saving");
    try {
      const { replacedMedications } = await confirmPrescription(
        draft.scan.id,
        draft.medications.map((item) => ({
          id: Number(item.id),
          schedule: item.schedule.map((slot) => ({
            timeOfDay: toTimeOfDay(slot),
            time: item.times[slot],
          })),
          lowStockAlert: item.alertEnabled,
        })),
      );
      const replaced = replacedMedications.map((item) => item.name.trim());
      showToast(
        `${draft.medications.length} medications saved to Jeanne's schedule.` +
          (replaced.length > 0
            ? ` Replaced the earlier ${replaced.join(", ")} (no duplicates, pills at home kept).`
            : ""),
      );
      setDraft(null);
      await refreshSchedule();
    } catch (error) {
      showToast((error as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const supplyDays = draft
    ? draft.medications.map(daysOfStock)
    : stock.map((item) => item.daysLeft);

  return (
    <>
      <a className="skip-link" href="#prescriptions">
        Skip to prescription review
      </a>

      <main className="rx-page" id="prescriptions" aria-busy={loading || busy !== null}>
        <div className="rx-container">
          <div className="hero rx-hero">
            <div className="rx-hero-copy">
              <span className="rx-hero-icon" aria-hidden="true">
                <ScanLine size={22} strokeWidth={2} />
              </span>
              <div>
                <p className="eyebrow">
                  <span>Caregiver Assisted Intake</span>
                  {draft ? (
                    <>
                      <span className="eyebrow-dot" aria-hidden="true">
                        &bull;
                      </span>
                      <span className="rx-session">Session #RX-{draft.scan.id}</span>
                    </>
                  ) : null}
                </p>
                <h1>Prescription Scan &amp; Review</h1>
              </div>
            </div>

            <p className="rx-validated-pill">
              <ShieldCheck size={18} strokeWidth={2} aria-hidden="true" />
              Validated with ANSM &amp; EMA European Medicines Index
            </p>
          </div>

          <div className="rx-grid">
            <div className="rx-left-column">
              <PrescriptionUploadCard onFileSelected={handleFile} browseRef={browseRef} />
              {draft ? (
                <ScanResultCard scan={draft.scan} medicationCount={draft.medications.length} />
              ) : null}
              <PillboxCoverageCard supplyDays={supplyDays} />
            </div>

            <section className="rx-right-column" aria-labelledby="verify-title">
              <div className="card rx-verify-header">
                <div>
                  <p className="rx-step-label">Step 2 of 2</p>
                  <h2 id="verify-title">
                    {draft ? "Verify Detected Medications" : "Nothing to review"}
                  </h2>
                </div>
                <span className="rx-validate-pill">
                  {draft ? (
                    <Archive size={17} strokeWidth={2} aria-hidden="true" />
                  ) : (
                    <Inbox size={17} strokeWidth={2} aria-hidden="true" />
                  )}
                  {busy === "scanning"
                    ? "Reading prescription…"
                    : loading
                      ? "Loading…"
                      : draft
                        ? `${draft.medications.length} items to validate`
                        : "Upload a prescription to start"}
                </span>
              </div>

              {draft?.medications.map((medication) => (
                <MedicationVerifyCard
                  key={medication.id}
                  medication={medication}
                  onToggleSlot={toggleSlot}
                  onChangeTime={changeTime}
                  onToggleAlert={toggleAlert}
                  onRemove={removeMedication}
                />
              ))}
            </section>
          </div>

          {draft ? (
            <section className="card rx-sync-bar" aria-labelledby="sync-title">
              <span className="rx-sync-icon" aria-hidden="true">
                <MonitorSmartphone size={22} strokeWidth={2} />
              </span>
              <div className="rx-sync-copy">
                <h2 id="sync-title">Ready to synchronize</h2>
                <p>Jeanne&apos;s digital pill dispenser and daily companion tablet will update immediately.</p>
              </div>
              <div className="rx-sync-actions">
                <button type="button" className="rx-secondary-button" onClick={retake} disabled={busy !== null}>
                  <RotateCcw size={16} strokeWidth={2.2} aria-hidden="true" />
                  Retake / Re-upload Prescription
                </button>
                <button
                  type="button"
                  className="rx-confirm-button"
                  onClick={confirmSchedule}
                  disabled={busy !== null}
                >
                  <CheckCheck size={18} strokeWidth={2.2} aria-hidden="true" />
                  {busy === "saving" ? "Saving…" : "Confirm & Save to Jeanne's Schedule"}
                </button>
              </div>
            </section>
          ) : null}

          <CurrentMedications
            medications={current}
            onChanged={handleScheduleChanged}
            onError={showToast}
          />

          <footer className="rx-trust-footer">
            <span className="rx-trust-strong">Data securely synchronized</span>
            <span aria-hidden="true">&bull;</span>
            <span>Official Public Health Medicine Index</span>
            <span aria-hidden="true">&bull;</span>
            <span>Encrypted End-to-End under European HDS Protocol</span>
          </footer>
        </div>
      </main>

      {toast ? <Toast key={toast.id} toast={toast} onDismiss={closeToast} /> : null}
    </>
  );
}
