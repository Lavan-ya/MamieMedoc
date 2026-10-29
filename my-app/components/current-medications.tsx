"use client";

import { useState } from "react";
import {
  Check,
  ClipboardList,
  Moon,
  Pencil,
  Sun,
  SunMedium,
  Sunset,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  stopMedication,
  updateMedication,
  type ApiCurrentMedication,
  type TimeOfDay,
} from "@/lib/api";

const SLOTS: { id: TimeOfDay; label: string; icon: LucideIcon }[] = [
  { id: "MORNING", label: "Morning", icon: SunMedium },
  { id: "MIDDAY", label: "Midday", icon: Sun },
  { id: "EVENING", label: "Evening", icon: Sunset },
  { id: "BEDTIME", label: "Bedtime", icon: Moon },
];

const DEFAULT_TIMES: Record<TimeOfDay, string> = {
  MORNING: "08:00",
  MIDDAY: "12:30",
  EVENING: "20:00",
  BEDTIME: "22:00",
};

type CurrentMedicationsProps = {
  medications: ApiCurrentMedication[];
  /** Called after a save or stop so the page can refresh lists and stock. */
  onChanged: (message: string) => void;
  onError: (message: string) => void;
};

export function CurrentMedications({ medications, onChanged, onError }: CurrentMedicationsProps) {
  return (
    <section className="card rx-current" aria-labelledby="current-title">
      <div className="rx-card-heading">
        <div className="rx-card-title">
          <ClipboardList size={22} strokeWidth={1.8} aria-hidden="true" />
          <h2 id="current-title">Jeanne&apos;s Current Medications</h2>
        </div>
        <span className="rx-step-pill">{medications.length} on schedule</span>
      </div>

      {medications.length === 0 ? (
        <p className="rx-current-empty">No medication on Jeanne&apos;s schedule yet.</p>
      ) : (
        <ul className="rx-current-list">
          {medications.map((medication) => (
            <CurrentMedicationRow
              key={medication.id}
              medication={medication}
              onChanged={onChanged}
              onError={onError}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function CurrentMedicationRow({
  medication,
  onChanged,
  onError,
}: {
  medication: ApiCurrentMedication;
  onChanged: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<TimeOfDay[]>([]);
  const [times, setTimes] = useState(DEFAULT_TIMES);

  const unit =
    medication.doseQuantity > 1 && !medication.doseUnit.endsWith("s")
      ? `${medication.doseUnit}s`
      : medication.doseUnit;
  const titleId = `current-${medication.id}-title`;

  function startEditing() {
    setSelected(medication.slots.map((slot) => slot.timeOfDay));
    setTimes({
      ...DEFAULT_TIMES,
      ...Object.fromEntries(medication.slots.map((slot) => [slot.timeOfDay, slot.time])),
    });
    setEditing(true);
  }

  function toggleSlot(slot: TimeOfDay) {
    setSelected((current) =>
      current.includes(slot) ? current.filter((value) => value !== slot) : [...current, slot],
    );
  }

  async function save() {
    if (selected.length === 0) {
      onError(`Choose at least one intake time for ${medication.name}, or stop it instead.`);
      return;
    }
    setSaving(true);
    try {
      await updateMedication(medication.id, {
        schedule: selected.map((slot) => ({ timeOfDay: slot, time: times[slot] })),
      });
      setEditing(false);
      onChanged(`${medication.name} schedule updated.`);
    } catch (error) {
      onError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function stop() {
    if (
      !window.confirm(
        `Stop ${medication.name} ${medication.strength}? It will be removed from Jeanne's schedule from today.`,
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await stopMedication(medication.id);
      onChanged(`${medication.name} stopped. It is no longer on Jeanne's schedule.`);
    } catch (error) {
      onError((error as Error).message);
      setSaving(false);
    }
  }

  return (
    <li className="rx-current-row" aria-labelledby={titleId}>
      <div className="rx-current-head">
        <div className="rx-med-identity">
          <h3 id={titleId}>
            {medication.name} <span>{medication.strength}</span>
          </h3>
          <p>
            {medication.doseQuantity} {unit} &bull; {medication.instruction}
            {medication.prescription ? ` • ${medication.prescription.doctorName}` : ""}
          </p>
        </div>

        {editing ? null : (
          <ul className="rx-current-chips" aria-label="Intake times">
            {medication.slots.map((slot) => (
              <li key={slot.id} className="rx-chip">
                {SLOTS.find((item) => item.id === slot.timeOfDay)?.label} {slot.time}
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing ? (
        <fieldset className="rx-schedule">
          <legend>Intake schedule</legend>
          <div className="rx-slot-grid">
            {SLOTS.map(({ id, label, icon: SlotIcon }) => {
              const active = selected.includes(id);
              return (
                <button
                  type="button"
                  key={id}
                  className={`rx-slot${active ? " is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => toggleSlot(id)}
                >
                  <SlotIcon size={16} strokeWidth={2} aria-hidden="true" />
                  {label}
                  {active ? <Check size={14} strokeWidth={2.6} aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>
          {selected.length > 0 ? (
            <div className="rx-time-editor">
              {SLOTS.filter(({ id }) => selected.includes(id)).map(({ id, label }) => (
                <label key={id} className="rx-time-field">
                  <span>{label}</span>
                  <input
                    type="time"
                    value={times[id]}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value) setTimes((current) => ({ ...current, [id]: value }));
                    }}
                  />
                </label>
              ))}
            </div>
          ) : null}
        </fieldset>
      ) : null}

      <div className="rx-med-actions">
        {editing ? (
          <>
            <button
              type="button"
              className="rx-med-action"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              <X size={16} strokeWidth={2.2} aria-hidden="true" />
              Cancel
            </button>
            <button
              type="button"
              className="rx-med-action rx-med-action--primary"
              onClick={save}
              disabled={saving}
            >
              <Check size={16} strokeWidth={2.4} aria-hidden="true" />
              {saving ? "Saving…" : "Save times"}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="rx-med-action" onClick={startEditing} disabled={saving}>
              <Pencil size={16} strokeWidth={2.2} aria-hidden="true" />
              Edit times
              <span className="sr-only"> for {medication.name}</span>
            </button>
            <button
              type="button"
              className="rx-med-action rx-med-action--danger"
              onClick={stop}
              disabled={saving}
            >
              <Trash2 size={16} strokeWidth={2.2} aria-hidden="true" />
              Stop
              <span className="sr-only"> {medication.name}</span>
            </button>
          </>
        )}
      </div>
    </li>
  );
}
