/** Supply considered "fully covered" for the ring, in days. */
const TARGET_DAYS = 21;
const RADIUS = 30;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** supplyDays: days of home supply per treatment (null = not scheduled). */
export function PillboxCoverageCard({ supplyDays }: { supplyDays: (number | null)[] }) {
  const days = supplyDays.map((value) => value ?? TARGET_DAYS);
  const covered = days.filter((value) => value >= 14).length;
  const percent = days.length
    ? Math.round(
        (days.reduce((sum, value) => sum + Math.min(value, TARGET_DAYS), 0) /
          (days.length * TARGET_DAYS)) *
          100,
      )
    : 0;

  return (
    <section className="rx-coverage-card" aria-labelledby="coverage-title">
      <div className="rx-coverage-ring">
        <svg viewBox="0 0 72 72" aria-hidden="true">
          <circle cx="36" cy="36" r={RADIUS} className="rx-ring-track" />
          <circle
            cx="36"
            cy="36"
            r={RADIUS}
            className="rx-ring-value"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - percent / 100)}
          />
        </svg>
        <strong>{percent}%</strong>
      </div>
      <div>
        <h2 id="coverage-title">Jeanne&apos;s Pillbox Coverage</h2>
        <p>
          {covered} of {days.length} treatments have over 2 weeks of available home supply.
        </p>
      </div>
    </section>
  );
}
