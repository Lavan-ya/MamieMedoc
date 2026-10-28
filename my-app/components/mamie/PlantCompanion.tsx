import { demoData } from "@/lib/demo-data";

function PlantIllustration({ newLeaf }: { newLeaf: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="h-16 w-16 lg:h-20 lg:w-20"
      fill="none"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 42L22 56C22 57.1 22.9 58 24 58H40C41.1 58 42 57.1 42 56L46 42H18Z"
        fill="#794B00"
        opacity="0.85"
      />
      <path
        d="M16 38H48C49.1 38 50 38.9 50 40C50 41.1 49.1 42 48 42H16C14.9 42 14 41.1 14 40C14 38.9 14.9 38 16 38Z"
        fill="#9A6100"
      />
      <path
        d="M32 38V12"
        stroke="#0D631B"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path d="M32 14C32 14 24 10 21 16C18 22 26 24 32 20" fill="#286B33" />
      <path d="M32 14C32 14 40 10 43 16C46 22 38 24 32 20" fill="#2E7D32" />
      <path d="M32 23C32 23 20 20 18 28C16 36 28 34 32 29" fill="#1B6D24" />
      <path d="M32 23C32 23 44 20 46 28C48 36 36 34 32 29" fill="#286B33" />
      <path d="M32 30C32 30 14 30 14 37C14 41 26 40 32 35" fill="#2E7D32" />
      <path d="M32 30C32 30 50 30 50 37C50 41 38 40 32 35" fill="#1B6D24" />
      {newLeaf ? (
        <>
          <path
            d="M40 12C40 12 49 7 53 14C57 21 47 24 41 19"
            fill="#2E7D32"
          />
          <circle cx="45" cy="13" fill="#88D982" r="2.5" />
        </>
      ) : null}
      <circle cx="32" cy="10" fill="#88D982" r="3" />
    </svg>
  );
}

export function PlantCompanion({ allTaken }: { allTaken: boolean }) {
  const plantName = demoData.plant.name;
  const plantFirstName = plantName.split(" ")[0];
  const happyDays = demoData.plant.happyDays + (allTaken ? 1 : 0);

  return (
    <section className="flex flex-col gap-4 rounded-lg bg-surface-container-lowest p-5 shadow-md">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <span className="text-[18px] font-bold uppercase tracking-wider text-primary">
          Daily companion
        </span>
        <span
          className={`self-start rounded-full px-3 py-1 text-[18px] font-bold xl:self-auto ${
            allTaken
              ? "bg-primary-fixed text-on-primary-fixed"
              : "bg-secondary-fixed text-on-secondary-fixed"
          }`}
        >
          {allTaken ? "New leaf" : "Fresh & green"}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div
          className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full shadow-inner lg:h-24 lg:w-24 ${
            allTaken ? "bg-secondary-container" : "bg-surface-container-low"
          }`}
        >
          <PlantIllustration newLeaf={allTaken} />
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-headline text-[24px] font-bold leading-snug text-on-surface">
            {allTaken
              ? `${plantFirstName} has a new leaf!`
              : `${plantName} is thriving!`}
          </h2>
          <p className="text-[18px] leading-snug text-on-surface-variant">
            {allTaken
              ? `You completed all your medicines today. A new leaf for ${plantFirstName}!`
              : `${plantFirstName} grows every morning you complete your care routine.`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-low p-4">
        <div className="flex flex-col">
          <span className="text-[18px] font-medium text-on-surface-variant">
            Care history
          </span>
          <span className="font-headline text-[24px] font-extrabold tracking-tight text-primary lg:text-[30px]">
            {happyDays} happy days
          </span>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-primary">
          <span
            className="material-symbols-outlined text-[28px]"
            aria-hidden="true"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            eco
          </span>
        </div>
      </div>
    </section>
  );
}
