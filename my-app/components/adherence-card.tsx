import { Check, Clock } from "lucide-react";
import { WEEKLY_ADHERENCE } from "@/lib/data";

export function AdherenceCard() {
  return (
    <section className="card adherence-card" aria-labelledby="adherence-title">
      <div className="adherence-header">
        <div>
          <h2 id="adherence-title">7-Day Adherence Journey</h2>
          <p>Consistently steady schedule with family monitoring</p>
        </div>
        <div className="adherence-score">
          <strong>92%</strong>
          <span>
            Weekly
            <br />
            Adherence
          </span>
        </div>
      </div>

      <div className="week-strip" role="list" aria-label="Adherence for the last seven days">
        {WEEKLY_ADHERENCE.map((item) => (
          <div
            className={`day-item day-item--${item.status}`}
            role="listitem"
            key={item.day}
            aria-label={`${item.day}: ${
              item.status === "partial" ? "partially completed" : "doses taken"
            }`}
          >
            <span className="day-label">{item.day}</span>
            <span className="day-circle">
              {item.status === "partial" ? (
                <Clock size={15} strokeWidth={2.2} aria-hidden="true" />
              ) : (
                <Check size={16} strokeWidth={2.8} aria-hidden="true" />
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="adherence-footer">
        <p>
          <span className="legend-dot legend-dot--green" aria-hidden="true" />
          6 of 7 days on track
        </p>
        <div className="adherence-legend" aria-hidden="true">
          <span>
            <i className="legend-dot legend-dot--green" /> On track
          </span>
          <span>
            <i className="legend-dot legend-dot--amber" /> Catch-up day
          </span>
        </div>
      </div>
    </section>
  );
}