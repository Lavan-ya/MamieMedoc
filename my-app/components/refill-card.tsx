"use client";

import { useState } from "react";
import { AlertCircle, Check, ChevronDown } from "lucide-react";

const PICKUP_OPTIONS = [
  "Thursday morning",
  "Thursday afternoon",
  "Friday morning",
  "Friday afternoon",
];

type RefillCardProps = {
  onNotify: (message: string) => void;
};

export function RefillCard({ onNotify }: RefillCardProps) {
  const [pickup, setPickup] = useState(PICKUP_OPTIONS[0]);
  const [handled, setHandled] = useState(false);

  function handleRefill(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHandled(true);
    onNotify(`Refill pickup planned for ${pickup}.`);
  }

  return (
    <section className="refill-card" aria-labelledby="refill-title">
      <div className="refill-topline">
        <div className="refill-alert-label">
          <span className="refill-icon" aria-hidden="true">
            <AlertCircle size={17} strokeWidth={2.4} />
          </span>
          <span>Urgent Refill Notice</span>
        </div>
        <span className="refill-days">5 Days Left</span>
      </div>

      <h2 id="refill-title">
        Metformin 500 mg
        <span>Running Low</span>
      </h2>
      <p className="refill-copy">
        Only <strong>5 tablets left</strong> in the pillbox dispenser. Prescription
        refill is required before Sunday noon to prevent interruption.
      </p>

      {handled ? (
        <div className="refill-confirmation" role="status">
          <span className="refill-confirmation-icon" aria-hidden="true">
            <Check size={14} strokeWidth={3} />
          </span>
          <div>
            <strong>Pickup planned for {pickup}</strong>
            <span>We&apos;ll remind you before you leave.</span>
          </div>
        </div>
      ) : (
        <form className="refill-form" onSubmit={handleRefill}>
          <label className="refill-label" htmlFor="pickup-time">
            When will you pick it up?
          </label>
          <div className="refill-controls">
            <div className="select-wrap">
              <select
                id="pickup-time"
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
            <button type="submit" className="refill-button">
              I&apos;ll handle this refill
            </button>
          </div>
        </form>
      )}
    </section>
  );
}