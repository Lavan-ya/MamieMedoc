"use client";

import { useState } from "react";
import { AlertCircle, Check, ChevronDown } from "lucide-react";
import type { ApiStockItem } from "@/lib/api";

const PICKUP_OPTIONS = [
  "Today",
  "Tomorrow morning",
  "Tomorrow afternoon",
  "This weekend",
];

type RefillCardProps = {
  item: ApiStockItem;
  patientName: string;
  onPlan: (medicationId: number, plannedFor: string) => Promise<void>;
  onPickedUp: (refillId: number, name: string, doses: number) => Promise<void>;
};

// A typical French pharmacy box covers about a month.
const DEFAULT_BOX_DOSES = 30;

function formatAcknowledged(iso: string) {
  const date = new Date(iso);
  const time = date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return date.toDateString() === new Date().toDateString()
    ? `today at ${time}`
    : `${date.toLocaleDateString("en-GB", { weekday: "long" })} at ${time}`;
}

/** Low-stock alert: one family member acknowledges it, everyone sees who. */
export function RefillCard({ item, patientName, onPlan, onPickedUp }: RefillCardProps) {
  const [pickup, setPickup] = useState(PICKUP_OPTIONS[0]);
  const [boxDoses, setBoxDoses] = useState(DEFAULT_BOX_DOSES);
  const [saving, setSaving] = useState(false);

  async function handlePickedUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!item.refill || boxDoses < 1) return;
    setSaving(true);
    await onPickedUp(item.refill.id, item.name, boxDoses);
    setSaving(false);
  }

  async function handleRefill(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    await onPlan(item.medicationId, pickup);
    setSaving(false);
  }

  const daysLabel =
    item.daysLeft === null ? "Low stock" : `${item.daysLeft} ${item.daysLeft === 1 ? "day" : "days"} left`;
  const titleId = `refill-title-${item.medicationId}`;

  return (
    <section
      className={`refill-card${item.refill ? " refill-card--acknowledged" : ""}`}
      aria-labelledby={titleId}
    >
      <div className="refill-topline">
        <div className="refill-alert-label">
          <span className="refill-icon" aria-hidden="true">
            <AlertCircle size={17} strokeWidth={2.4} />
          </span>
          <span>{item.refill ? "Refill in hand" : "Low stock alert"}</span>
        </div>
        <span className="refill-days">{daysLabel}</span>
      </div>

      <h2 id={titleId}>
        {item.name} {item.strength}
        <span>Running Low</span>
      </h2>
      <p className="refill-copy">
        Only{" "}
        <strong>
          {item.stockDoses} {item.unit} left
        </strong>{" "}
        at home.{" "}
        {item.refill
          ? "Thank you for taking care of it."
          : "Who in the family can pick up a refill?"}
      </p>

      {item.refill ? (
        <>
          <div className="refill-confirmation" role="status">
            <span className="refill-confirmation-icon" aria-hidden="true">
              <Check size={14} strokeWidth={3} />
            </span>
            <div>
              <strong>
                {item.refill.by} acknowledged and is working on it
              </strong>
              <span>
                Picking it up {item.refill.plannedFor.toLowerCase()} · acknowledged{" "}
                {formatAcknowledged(item.refill.acknowledgedAt)}
              </span>
              <span>{patientName} sees on her screen that {item.refill.by} will help.</span>
            </div>
          </div>
          <form className="refill-form" onSubmit={handlePickedUp}>
            <label className="refill-label" htmlFor={`box-doses-${item.medicationId}`}>
              Brought it home? Doses in the new box
            </label>
            <div className="refill-controls">
              <input
                id={`box-doses-${item.medicationId}`}
                className="refill-input"
                type="number"
                min={1}
                max={1000}
                value={boxDoses}
                onChange={(event) => setBoxDoses(Number(event.target.value))}
              />
              <button type="submit" className="refill-button" disabled={saving || boxDoses < 1}>
                {saving ? "Saving…" : "Mark as picked up"}
              </button>
            </div>
          </form>
        </>
      ) : (
        <form className="refill-form" onSubmit={handleRefill}>
          <label className="refill-label" htmlFor={`pickup-time-${item.medicationId}`}>
            When will you pick it up?
          </label>
          <div className="refill-controls">
            <div className="select-wrap">
              <select
                id={`pickup-time-${item.medicationId}`}
                value={pickup}
                onChange={(event) => setPickup(event.target.value)}
              >
                {PICKUP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} strokeWidth={2.1} aria-hidden="true" />
            </div>
            <button type="submit" className="refill-button" disabled={saving}>
              {saving ? "Saving…" : "I'll take care of it"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
