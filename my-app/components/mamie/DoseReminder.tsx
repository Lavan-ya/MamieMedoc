"use client";

import { useEffect } from "react";

import type { Dose } from "@/lib/demo-data";
import { SNOOZE_MINUTES, type MamieDose } from "@/lib/mamie";

function capitalizeFirst(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function timingIcon(period: Dose["period"]) {
  if (period === "Morning") return "wb_sunny";
  if (period === "Lunch") return "restaurant";
  return "bedtime";
}

export function DoseReminder({
  dose,
  familyName,
  busy = false,
  onTake,
  onRemind,
  onListen,
  onCallFamily,
}: {
  dose: MamieDose;
  /** Who is told when the dose is taken or missed, e.g. "Lavanya". */
  familyName: string;
  busy?: boolean;
  onTake: () => void;
  onRemind: () => void;
  onListen: () => void;
  onCallFamily: () => void;
}) {
  // After the last snooze the reminder comes back once more, without snooze.
  const canSnooze = dose.snoozesLeft > 0;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Escape snoozes, like the button; the last reminder can't be dismissed.
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && canSnooze && !busy) onRemind();
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onRemind, canSnooze, busy]);

  const timeSlot = `${dose.period} · ${dose.time.replace(/^0/, "")}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-stretch justify-center overflow-y-auto bg-on-surface/60 p-0 backdrop-blur-sm md:items-center md:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dose-reminder-title"
        className="flex min-h-dvh w-full flex-col items-center bg-background px-5 py-8 md:min-h-0 md:max-h-[90dvh] md:max-w-2xl md:justify-center md:overflow-y-auto md:rounded-xl md:p-10 md:shadow-2xl"
      >
        <div className="mx-auto flex w-full max-w-md flex-col items-center">
          <div className="relative mb-4 flex items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute h-28 w-28 animate-ping rounded-full bg-tertiary-fixed/40 opacity-60"
            />
            <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed shadow-md">
              <span
                className="material-symbols-outlined text-[52px]"
                aria-hidden="true"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                notifications_active
              </span>
            </span>
          </div>

          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-surface-container-high px-5 py-2 shadow-sm">
            <span
              className="material-symbols-outlined text-[24px] text-primary"
              aria-hidden="true"
            >
              schedule
            </span>
            <span className="text-[20px] font-semibold text-on-surface">
              {timeSlot}
            </span>
          </div>

          <h1
            id="dose-reminder-title"
            className="mb-4 text-center font-headline text-[30px] font-extrabold leading-tight tracking-tight text-on-surface md:text-[36px]"
          >
            It&apos;s time for your medicine
          </h1>

          <button
            type="button"
            onClick={onListen}
            aria-label="Listen to the reminder out loud"
            className="mb-5 flex min-h-14 items-center gap-3 rounded-full bg-surface-container-highest px-6 text-[20px] font-bold text-on-surface transition-colors hover:bg-surface-container-high active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span
              className="material-symbols-outlined text-[28px] text-primary"
              aria-hidden="true"
            >
              volume_up
            </span>
            <span>Listen</span>
          </button>

          <div className="mb-5 flex w-full flex-col items-center rounded-xl bg-surface-container-lowest p-5 text-center shadow-md">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container/60 text-primary shadow-sm">
              <span
                className="material-symbols-outlined text-[40px]"
                aria-hidden="true"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                medication
              </span>
            </div>

            <span className="mt-3 font-headline text-[30px] font-extrabold leading-tight tracking-tight text-on-surface">
              {dose.medication}
            </span>

            <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-surface-container-low p-3">
              <span
                className="material-symbols-outlined text-[28px] text-primary"
                aria-hidden="true"
              >
                pill
              </span>
              <span className="text-[20px] font-bold leading-snug text-on-surface">
                {dose.dosage}
                {dose.instructions ? ` ${dose.instructions}` : ""}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 text-[18px] text-on-surface-variant">
              <span
                className="material-symbols-outlined text-[22px]"
                aria-hidden="true"
              >
                {timingIcon(dose.period)}
              </span>
              <span>{capitalizeFirst(dose.timing)}</span>
            </div>
          </div>

          {canSnooze ? null : (
            <p
              role="alert"
              className="mb-4 w-full rounded-2xl bg-error-container px-4 py-3 text-center text-[20px] font-semibold leading-snug text-on-error-container"
            >
              Last reminder. If you don&apos;t take it now, {familyName} will
              be told you missed it.
            </p>
          )}

          <button
            type="button"
            onClick={onTake}
            disabled={busy}
            autoFocus
            className="flex min-h-20 w-full items-center justify-center gap-3 rounded-full bg-primary-container px-6 py-4 text-[24px] font-extrabold text-on-primary shadow-xl transition-all hover:bg-primary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            <span
              className="material-symbols-outlined text-[40px]"
              aria-hidden="true"
            >
              check_circle
            </span>
            <span className="text-left leading-tight">
              I have taken my medicine
            </span>
          </button>

          {canSnooze ? (
            <button
              type="button"
              onClick={onRemind}
              disabled={busy}
              className="mt-3 flex min-h-16 w-full flex-col items-center justify-center rounded-full bg-surface-container px-6 py-2 text-[20px] font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              <span className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined text-[28px]"
                  aria-hidden="true"
                >
                  snooze
                </span>
                <span className="text-center leading-tight">
                  Remind me in {SNOOZE_MINUTES} minutes
                </span>
              </span>
              <span className="text-[18px] font-normal">
                {dose.snoozesLeft === 1
                  ? "You can ask once more"
                  : `You can ask ${dose.snoozesLeft} more times`}
              </span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={onCallFamily}
            className="mt-3 flex min-h-14 w-full items-center justify-center gap-3 rounded-full px-6 text-[20px] font-semibold text-primary transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
              call
            </span>
            Call my family
          </button>

          <p className="mt-4 text-center text-[18px] leading-relaxed text-on-surface-variant">
            {familyName} will be told with love that you took it.
          </p>
        </div>
      </div>
    </div>
  );
}
