"use client";

import { useState } from "react";
import { Check, Clock, Flame, Minus, Timer, X } from "lucide-react";
import type { ApiAdherence, ApiAdherenceDay, ApiAdherenceDose } from "@/lib/api";

const STATUS_LABELS: Record<ApiAdherenceDay["status"], string> = {
  complete: "all doses taken",
  partial: "some doses missed",
  missed: "doses missed",
  none: "no doses recorded",
  today: "today, in progress",
};

function weekday(date: string, style: "short" | "long" = "short") {
  // Noon avoids the date shifting across timezones.
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: style });
}

function fullDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function DayIcon({ status }: { status: ApiAdherenceDay["status"] }) {
  if (status === "complete") return <Check size={18} strokeWidth={2.8} aria-hidden="true" />;
  if (status === "partial" || status === "today") return <Clock size={17} strokeWidth={2.2} aria-hidden="true" />;
  if (status === "missed") return <X size={17} strokeWidth={2.6} aria-hidden="true" />;
  return <Minus size={17} strokeWidth={2.2} aria-hidden="true" />;
}

function doseStatus(dose: ApiAdherenceDose) {
  if (dose.status === "TAKEN") {
    return {
      label: dose.takenAt ? `Taken ${clock(dose.takenAt)}${dose.late ? " · late" : ""}` : "Taken",
      tone: dose.late ? "late" : "taken",
    };
  }
  if (dose.status === "MISSED") return { label: "Missed", tone: "missed" };
  return { label: "Pending", tone: "pending" };
}

/** Family view of the last 7 days: score, streak, punctuality, and per-day details. */
export function AdherenceCard({ adherence }: { adherence: ApiAdherence | null }) {
  const days = adherence?.days ?? [];
  // Default to the latest day with doses (today, or yesterday early in the morning).
  const defaultDay = [...days].reverse().find((day) => day.scheduled > 0)?.date ?? null;
  const [selected, setSelected] = useState<string | null>(null);
  const selectedDay = days.find((day) => day.date === (selected ?? defaultDay));

  const pastTaken = days
    .filter((day) => day.status !== "today")
    .flatMap((day) => day.doses)
    .filter((dose) => dose.status === "TAKEN");
  const onTime = pastTaken.length
    ? Math.round((pastTaken.filter((dose) => !dose.late).length / pastTaken.length) * 100)
    : null;

  return (
    <section className="card adherence-card" aria-labelledby="adherence-title">
      <div className="adherence-header">
        <div>
          <h2 id="adherence-title">7-Day Adherence Journey</h2>
          <p>
            Under each day: doses taken / doses planned. Tap a day to see each dose.
          </p>
        </div>
        <div className="adherence-score">
          <strong>{adherence?.percent != null ? `${adherence.percent}%` : "–"}</strong>
          <span>
            Doses
            <br />
            taken
          </span>
        </div>
      </div>

      {adherence ? (
        <dl className="adherence-stats">
          <div>
            <dt>
              <Check size={16} strokeWidth={2.6} aria-hidden="true" /> Complete days
            </dt>
            <dd>
              {adherence.daysOnTrack} of {adherence.daysTracked}
            </dd>
          </div>
          <div>
            <dt>
              <Flame size={16} strokeWidth={2.2} aria-hidden="true" /> Streak
            </dt>
            <dd>
              {adherence.streak} {adherence.streak === 1 ? "day" : "days"}
            </dd>
          </div>
          <div>
            <dt>
              <Timer size={16} strokeWidth={2.2} aria-hidden="true" /> On time
            </dt>
            <dd>{onTime != null ? `${onTime}%` : "–"}</dd>
          </div>
        </dl>
      ) : null}

      <div className="week-strip" role="group" aria-label="Last seven days">
        {days.map((day) => {
          const isSelected = selectedDay?.date === day.date;
          return (
            <button
              type="button"
              key={day.date}
              className={`day-item day-item--${day.status}${isSelected ? " is-selected" : ""}`}
              aria-pressed={isSelected}
              aria-label={`${fullDate(day.date)}: ${STATUS_LABELS[day.status]}${
                day.scheduled > 0 ? `, ${day.taken} of ${day.scheduled} doses` : ""
              }`}
              onClick={() => setSelected(day.date)}
            >
              <span className="day-label">{day.status === "today" ? "Today" : weekday(day.date)}</span>
              <span className="day-circle">
                <DayIcon status={day.status} />
              </span>
              <span className="day-count" title={`${day.taken} of ${day.scheduled} doses taken`}>
                {day.scheduled > 0 ? `${day.taken}/${day.scheduled}` : "–"}
              </span>
            </button>
          );
        })}
      </div>

      {selectedDay ? (
        <div className="day-detail" aria-live="polite">
          <h3>
            {selectedDay.status === "today" ? "Today" : fullDate(selectedDay.date)}
            <span>
              {selectedDay.scheduled > 0
                ? `${selectedDay.taken} of ${selectedDay.scheduled} doses taken`
                : "No doses recorded"}
            </span>
          </h3>
          {selectedDay.doses.length > 0 ? (
            <ul>
              {selectedDay.doses.map((dose) => {
                const status = doseStatus(dose);
                return (
                  <li key={dose.id} className="day-dose">
                    <span className="day-dose-time">{dose.time}</span>
                    <span className="day-dose-name">{dose.medication}</span>
                    <span className={`day-dose-status day-dose-status--${status.tone}`}>{status.label}</span>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="adherence-footer">
        <div className="adherence-legend" aria-hidden="true">
          <span>
            <i className="legend-dot legend-dot--green" /> All taken
          </span>
          <span>
            <i className="legend-dot legend-dot--amber" /> Some missed
          </span>
          <span>
            <i className="legend-dot legend-dot--red" /> Missed
          </span>
          <span>10/10 = doses taken / planned</span>
          <span>“Late” = over an hour after its time</span>
        </div>
      </div>
    </section>
  );
}
