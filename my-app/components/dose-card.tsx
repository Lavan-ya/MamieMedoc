import { Check, Clock, Info, PillBottle, X } from "lucide-react";
import type { Dose } from "@/lib/data";

type DoseCardProps = {
  doses: Dose[];
  patientName: string;
  loading?: boolean;
};

/** Read-only: family members see whether each dose was taken, and when. */
export function DoseCard({ doses, patientName, loading = false }: DoseCardProps) {
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
            <p>
              {loading
                ? "Loading today's schedule…"
                : `${doses.length} ${doses.length === 1 ? "dose" : "doses"} scheduled for Grandma ${patientName}`}
            </p>
          </div>
        </div>
        <span className="count-pill" aria-live="polite">
          <strong>{takenCount}</strong> of {doses.length} Taken
        </span>
      </div>

      {!loading && doses.length === 0 ? (
        <p className="dose-empty">No medication is scheduled for today.</p>
      ) : null}

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
                  <strong>Taken at {dose.takenAt}</strong>
                </span>
              ) : dose.status === "missed" ? (
                <span className="dose-status dose-status--missed">
                  <X size={14} strokeWidth={2.6} aria-hidden="true" />
                  <strong>Missed</strong>
                </span>
              ) : (
                <span className="dose-status dose-status--pending">
                  <Clock size={14} strokeWidth={2.1} aria-hidden="true" />
                  <strong>Pending</strong>
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}