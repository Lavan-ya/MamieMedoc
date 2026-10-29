import type { ApiGarden } from "@/lib/api";
import { GROWTH_DAYS, growthLabel, varietyFor } from "@/lib/plant";
import { PlantArt } from "./PlantArt";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function shortDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/**
 * This week's plant (it grows one step each day Jeanne takes every planned
 * medicine) and her garden, where each finished week's plant is planted.
 */
export function PlantCompanion({
  garden,
  todayComplete,
}: {
  garden: ApiGarden | null;
  /** Every scheduled medicine of today is taken. */
  todayComplete: boolean;
}) {
  if (!garden) return null;

  const { week } = garden;
  const variety = varietyFor(week.weekStart);
  const grown = Math.min(GROWTH_DAYS, week.grownDays + (todayComplete ? 1 : 0));
  const age = week.days.length; // Monday = day 1
  const isSunday = age === 7;

  const headline = todayComplete
    ? `Your ${variety.name.toLowerCase()} grew today!`
    : grown === 0
      ? `A new ${variety.name.toLowerCase()} seed`
      : `Your ${variety.name.toLowerCase()} is waiting for you`;
  const message = todayComplete
    ? isSunday
      ? `What a week! Tonight it goes into your garden.`
      : `Thank you for taking all your medicines. It grows a little every day you do.`
    : `Take all of today's medicines and it will grow a little more.`;

  return (
    <>
      <section
        aria-labelledby="plant-title"
        className="flex flex-col gap-4 rounded-lg bg-surface-container-lowest p-5 shadow-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[18px] font-bold uppercase tracking-wider text-primary">
            This week&apos;s {variety.name}
          </span>
          <span className="rounded-full bg-secondary-fixed px-3 py-1 text-[18px] font-bold text-on-secondary-fixed">
            Day {age} of 7
          </span>
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <div
            className={`flex shrink-0 items-end justify-center rounded-3xl ${
              todayComplete ? "bg-secondary-container/60" : "bg-surface-container-low"
            }`}
          >
            <PlantArt variety={variety} grown={grown} sway sparkle={todayComplete} className="h-44 w-44 lg:h-52 lg:w-52" />
          </div>
          <div className="flex min-w-0 flex-col gap-1 text-center sm:text-left">
            <h2 id="plant-title" className="font-headline text-[24px] font-bold leading-snug text-on-surface">
              {headline}
            </h2>
            <p className="text-[18px] leading-snug text-on-surface-variant">{message}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3 text-[18px]">
            <span className="font-semibold text-on-surface">{growthLabel(grown)}</span>
            <span className="text-on-surface-variant">
              Grown {grown} of 7 days
            </span>
          </div>
          <div
            className="h-3 overflow-hidden rounded-full bg-surface-container-high"
            role="progressbar"
            aria-label={`${variety.name} growth`}
            aria-valuemin={0}
            aria-valuemax={GROWTH_DAYS}
            aria-valuenow={grown}
          >
            <div
              className="h-full rounded-full bg-primary-container transition-[width] duration-700"
              style={{ width: `${(grown / GROWTH_DAYS) * 100}%` }}
            />
          </div>
        </div>

        <ol className="grid grid-cols-7 gap-1" aria-label="This week">
          {WEEKDAYS.map((label, index) => {
            const date = addDays(week.weekStart, index);
            const day = week.days[index];
            const isToday = index === week.days.length - 1;
            const future = index >= week.days.length;
            const good = isToday ? todayComplete : day?.status === "complete";
            const state = future ? "to come" : isToday ? (good ? "grew" : "today") : good ? "grew" : "no growth";
            return (
              <li key={date} className="flex flex-col items-center gap-1" aria-label={`${label} ${shortDate(date)}: ${state}`}>
                <span className={`text-[16px] ${isToday ? "font-bold text-on-surface" : "text-on-surface-variant"}`}>
                  {isToday ? "Today" : label}
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    good
                      ? "bg-primary-container text-on-primary"
                      : isToday
                        ? "border-2 border-dashed border-primary text-primary"
                        : future
                          ? "bg-surface-container text-outline-variant"
                          : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={good ? { fontVariationSettings: "'FILL' 1" } : undefined}
                  >
                    {future ? "circle" : "eco"}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>

        <p className="rounded-2xl bg-surface-container-low p-3 text-center text-[18px] text-on-surface-variant">
          {isSunday
            ? "Tonight this plant is planted in your garden."
            : `On Sunday it will be planted in your garden, and a new seed will start.`}
        </p>
      </section>

      <section
        aria-labelledby="garden-title"
        className="flex flex-col gap-3 rounded-lg bg-surface-container-lowest p-5 shadow-md"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="garden-title" className="font-headline text-[24px] font-bold text-on-surface">
            My garden
          </h2>
          <span className="text-[18px] text-on-surface-variant">
            {garden.garden.length} {garden.garden.length === 1 ? "plant" : "plants"}
          </span>
        </div>

        {garden.garden.length === 0 ? (
          <p className="text-[18px] text-on-surface-variant">
            Your garden is waiting. On Sunday, this week&apos;s {variety.name.toLowerCase()} will be the first plant in it.
          </p>
        ) : (
          <ul className="garden-bed grid grid-cols-3 gap-x-1 gap-y-3 rounded-2xl px-2 pb-3 pt-2 sm:grid-cols-4">
            {[...garden.garden].reverse().map((plant) => {
              const plantVariety = varietyFor(plant.weekStart);
              return (
                <li
                  key={plant.weekStart}
                  className="flex flex-col items-center"
                  aria-label={`${plantVariety.name}, week of ${shortDate(plant.weekStart)}: grew ${plant.grownDays} of 7 days`}
                >
                  <PlantArt variety={plantVariety} grown={plant.grownDays} potted={false} className="h-24 w-24" />
                  <span className="text-[16px] font-semibold leading-tight text-on-surface">{plantVariety.name}</span>
                  <span className="text-[15px] leading-tight text-on-surface-variant">
                    {shortDate(plant.weekStart)} · {plant.grownDays}/7
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
