"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Pill, Plus, X } from "lucide-react";
import type { Dose } from "@/lib/data";

type AddPrescriptionDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (dose: Dose) => void;
};

const EMPTY_FORM = {
  name: "",
  dosage: "",
  time: "14:00",
  period: "Lunch",
  instructions: "",
};

export function AddPrescriptionDialog({
  open,
  onClose,
  onAdd,
}: AddPrescriptionDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    setForm(EMPTY_FORM);
    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => nameInputRef.current?.focus(), 60);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    const dosage = form.dosage.trim();
    if (!name || !dosage) return;

    onAdd({
      id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      name,
      dosage,
      time: form.time,
      period: form.period,
      instructions:
        form.instructions.trim() || "Take as prescribed by the care team",
      status: "pending",
    });
    onClose();
  }

  if (!open) return null;

  return createPortal(
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="prescription-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-prescription-title"
        aria-describedby="add-prescription-description"
      >
        <div className="dialog-heading">
          <span className="dialog-icon" aria-hidden="true">
            <Pill size={21} strokeWidth={1.9} />
          </span>
          <div>
            <h2 id="add-prescription-title">Add a prescription</h2>
            <p id="add-prescription-description">
              Add a new medication to Jeanne&apos;s daily care schedule.
            </p>
          </div>
          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            aria-label="Close add prescription dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form className="prescription-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="medication-name">Medication name</label>
            <input
              ref={nameInputRef}
              id="medication-name"
              name="medicationName"
              type="text"
              placeholder="e.g. Amlodipine"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              autoComplete="off"
              required
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="medication-dosage">Strength / dosage</label>
              <input
                id="medication-dosage"
                name="dosage"
                type="text"
                placeholder="e.g. 5 mg"
                value={form.dosage}
                onChange={(event) => updateField("dosage", event.target.value)}
                autoComplete="off"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="medication-time">Scheduled time</label>
              <input
                id="medication-time"
                name="time"
                type="time"
                value={form.time}
                onChange={(event) => updateField("time", event.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="medication-period">Time slot</label>
            <div className="select-wrap dialog-select">
              <select
                id="medication-period"
                name="period"
                value={form.period}
                onChange={(event) => updateField("period", event.target.value)}
              >
                <option>Morning</option>
                <option>Lunch</option>
                <option>Evening</option>
                <option>Bedtime</option>
              </select>
              <ChevronDown size={14} strokeWidth={2.1} aria-hidden="true" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="medication-instructions">
              Instructions <span className="optional-label">(optional)</span>
            </label>
            <textarea
              id="medication-instructions"
              name="instructions"
              rows={3}
              placeholder="e.g. Take one tablet with water after breakfast"
              value={form.instructions}
              onChange={(event) => updateField("instructions", event.target.value)}
            />
          </div>

          <div className="dialog-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button dialog-submit">
              <Plus size={16} strokeWidth={2.6} aria-hidden="true" />
              Add Prescription
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}