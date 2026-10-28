"use client";

import { Check, Clock, Info, PillBottle } from "lucide-react";
import type { Dose } from "@/lib/data";

type DoseCardProps = {
  doses: Dose[];
  onMarkDone: (id: string) => void;
};

export function DoseCard({ doses, onMarkDone }: DoseCardProps) {
  const takenCount = doses.filter((dose) => dose.status === "taken").length;

  return (
    <section className="card dose-card" id="doses" aria-labelledby="doses-title">
      <div className="card-header">
        <div className="title-group">
          <span className="icon-tile" aria-hidden="true">
            <PillBottle size={20} strokeWidth={1.9} />
          </span>
          <div>
            <h2 id="doses-title">Today&apos;s Doses</h2>
            <p>{doses.length} time slots scheduled for Grandma Jeanne</p>
          </div>
        </div>
        <span className="count-pill" aria-live="polite">
          <strong>{takenCount}</strong> of {doses.length} Taken
        </span>
      </div>

      <ul className="dose-list">
        {doses.map((dose) => (
          <li className={`dose-row dose-row--${dose.status}`} key={dose.id}>
            <div className="dose-time">
              <span className="dose-time-value">{dose.time}</span>
              <span className="dose-time-period">{dose.period}</span>
            </div>

            <div className="dose-copy">
              <div className="dose-name-line">
                <h3>
                  {dose.name} <span>{dose.dosage}</span>
                </h3>
                <span
                  className="info-icon"
                  role="img"
                  aria-label={`Instructions: ${dose.instructions}`}
                  title={dose.instructions}
                >
                  <Info size={13} strokeWidth={1.8} />
                </span>
              </div>
              <p>{dose.instructions}</p>
            </div>

            <div className="dose-action">
              {dose.status === "taken" ? (
                <span className="dose-status dose-status--taken">
                  <span className="status-check" aria-hidden="true">
                    <Check size={11} strokeWidth={3} />
                  </span>
                  <span>
                    <strong>Taken at</strong>
                    <span>{dose.takenAt}</span>
                  </span>
                </span>
              ) : null}

              {dose.status === "pending" ? (
                <>
                  <span className="dose-status dose-status--pending">
                    <Clock size={14} strokeWidth={2.1} aria-hidden="true" />
                    <span>
                      <strong>Pending</strong>
                      <span>Due Soon</span>
                    </span>
                  </span>
                  <button
                    type="button"
                    className="mark-done-button"
                    onClick={() => onMarkDone(dose.id)}
                    aria-label={`Mark ${dose.name} ${dose.dosage} as taken`}
                  >
                    <Check size={12} strokeWidth={2.8} aria-hidden="true" />
                    Mark Done
                  </button>
                </>
              ) : null}

              {dose.status === "scheduled" ? (
                <span className="dose-status dose-status--scheduled">
                  <Clock size={14} strokeWidth={2} aria-hidden="true" />
                  Scheduled
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}