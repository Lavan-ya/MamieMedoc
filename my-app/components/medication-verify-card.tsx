"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bandage,
  Check,
  Droplet,
  Moon,
  Pencil,
  Pill,
  Sparkles,
  Sun,
  SunMedium,
  Sunset,
  Trash2,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { daysOfStock, type DetectedMedication, type IntakeSlot } from "@/lib/data";

const SLOTS: { id: IntakeSlot; label: string; icon: LucideIcon }[] = [
  { id: "morning", label: "Morning", icon: SunMedium },
  { id: "midday", label: "Midday", icon: Sun },
  { id: "evening", label: "Evening", icon: Sunset },
  { id: "bedtime", label: "Bedtime", icon: Moon },
];

const KIND_ICONS: Record<DetectedMedication["kind"], LucideIcon> = {
  cardio: Pill,
  glucose: Activity,
  pain: Bandage,
};

const FORM_ICONS: Record<DetectedMedication["doseForm"], LucideIcon> = {
  sachet: Droplet,
  tablet: Utensils,
  effervescent: Sparkles,
};

function stockLabel(days: number | null, low: boolean) {
  if (days === null) return "Not scheduled";
  if (low) return "Refill suggested";
  if (days >= 14) return `${Math.floor(days / 7)} weeks left`;
  return `${days} days left`;
}

type MedicationVerifyCardProps = {
  medication: DetectedMedication;
  onToggleSlot: (id: string, slot: IntakeSlot) => void;
  onChangeTime: (id: string, slot: IntakeSlot, time: string) => void;
  onToggleAlert: (id: string) => void;
  onRemove: (id: string) => void;
};

export function MedicationVerifyCard({
  medication,
  onToggleSlot,
  onChangeTime,
  onToggleAlert,
  onRemove,
}: MedicationVerifyCardProps) {
  const [editing, setEditing] = useState(false);
  const days = daysOfStock(medication);
  const low = days !== null && days <= medication.alertDays;
  const KindIcon = KIND_ICONS[medication.kind];
  const FormIcon = FORM_ICONS[medication.doseForm];
  const titleId = `med-${medication.id}-title`;
  const alertId = `med-${medication.id}-alert`;

  return (
    <article className={`card rx-med-card${low ? " is-low" : ""}`} aria-labelledby={titleId}>
      <header className="rx-med-header">
        <span className="rx-med-icon" aria-hidden="true">
          <KindIcon size={20} strokeWidth={2} />
        </span>
        <div className="rx-med-identity">
          <h3 id={titleId}>
            {medication.name} <span>{medication.strength}</span>
          </h3>
          <p>
            {medication.molecule} &bull; {medication.purpose}
          </p>
        </div>
        {low ? (
          <span className="rx-match-pill rx-match-pill--low">
            <AlertTriangle size={15} strokeWidth={2.4} aria-hidden="true" />
            Low stock alert: {days} days remaining
          </span>
        ) : (
          <span className="rx-match-pill">{medication.matchLabel}</span>
        )}
      </header>

      <dl className="rx-med-stats">
        <div>
          <dt>Prescribed Dose</dt>
          <dd className="rx-dose">
            <FormIcon size={18} strokeWidth={2} aria-hidden="true" />
            <strong>{medication.dose}</strong>
            {medication.doseNote ? <span>{medication.doseNote}</span> : null}
          </dd>
        </div>
        <div>
          <dt>Stock at Home</dt>
          <dd className="rx-stock">
            <strong>{medication.stockDoses} doses</strong>
            <span className="rx-stock-pill">{stockLabel(days, low)}</span>
          </dd>
        </div>
      </dl>

      <fieldset className="rx-schedule">
        <legend>Intake Schedule for Jeanne</legend>
        <div className="rx-slot-grid">
          {SLOTS.map(({ id, label, icon: SlotIcon }) => {
            const active = medication.schedule.includes(id);
            return (
              <button
                type="button"
                key={id}
                className={`rx-slot${active ? " is-active" : ""}`}
                aria-pressed={active}
                onClick={() => onToggleSlot(medication.id, id)}
              >
                <SlotIcon size={16} strokeWidth={2} aria-hidden="true" />
                {label}
                {active ? (
                  <>
                    <span className="rx-slot-time">{medication.times[id]}</span>
                    <Check size={14} strokeWidth={2.6} aria-hidden="true" />
                  </>
                ) : null}
              </button>
            );
          })}
        </div>

        {editing ? (
          <div className="rx-time-editor">
            {medication.schedule.length === 0 ? (
              <p>Select an intake slot above to set its time.</p>
            ) : (
              SLOTS.filter(({ id }) => medication.schedule.includes(id)).map(({ id, label }) => (
                <label key={id} className="rx-time-field">
                  <span>{label}</span>
                  <input
                    type="time"
                    value={medication.times[id]}
                    onChange={(event) => {
                      if (event.target.value) onChangeTime(medication.id, id, event.target.value);
                    }}
                  />
                </label>
              ))
            )}
          </div>
        ) : null}
      </fieldset>

      <div className="rx-alert-toggle">
        <input
          type="checkbox"
          id={alertId}
          checked={medication.alertEnabled}
          onChange={() => onToggleAlert(medication.id)}
        />
        <label htmlFor={alertId}>
          Alert when fewer than <strong>{medication.alertDays} days</strong> left
          {medication.alertTarget ? ` (Notification prepared for ${medication.alertTarget})` : ""}
        </label>
      </div>

      <div className="rx-med-actions">
        <button
          type="button"
          className="rx-med-action"
          aria-expanded={editing}
          onClick={() => setEditing((current) => !current)}
        >
          {editing ? (
            <Check size={16} strokeWidth={2.4} aria-hidden="true" />
          ) : (
            <Pencil size={16} strokeWidth={2.2} aria-hidden="true" />
          )}
          {editing ? "Done" : "Edit times"}
          <span className="sr-only"> for {medication.name}</span>
        </button>
        <button
          type="button"
          className="rx-med-action rx-med-action--danger"
          onClick={() => onRemove(medication.id)}
        >
          <Trash2 size={16} strokeWidth={2.2} aria-hidden="true" />
          Remove
          <span className="sr-only"> {medication.name}</span>
        </button>
      </div>
    </article>
  );
}
