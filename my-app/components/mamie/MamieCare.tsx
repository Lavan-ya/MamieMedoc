"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CallFamilyDialog } from "./CallFamilyDialog";
import { DoseReminder } from "./DoseReminder";
import { PlantCompanion } from "./PlantCompanion";
import { ReminderNotifications } from "./ReminderNotifications";
import { markDoseTaken, snoozeDose, type ApiGarden } from "@/lib/api";
import { demoData, type Dose } from "@/lib/demo-data";
import {
  dueAt,
  EMERGENCY_NUMBER,
  formatClock,
  reminderDose,
  SNOOZE_MINUTES,
  type CallMember,
  type FamilyNote,
  type MamieDose,
} from "@/lib/mamie";
import { telHref } from "@/lib/phone";
import type { Weather } from "@/lib/weather";
import { readProfile, saveProfile } from "@/lib/profile";

const firstName = demoData.mamie.name.split(" ")[0];

// How often the screen checks whether a medicine is due.
const TICK_MS = 15_000;
// A dose can be confirmed from the main card this long before its time.
const EARLY_TAKE_MS = 30 * 60_000;

function subscribeToClient() {
  return () => {};
}

function getIsClient() {
  return true;
}

function getIsServer() {
  return false;
}

function subscribeToClock(onStoreChange: () => void) {
  const interval = window.setInterval(onStoreChange, TICK_MS);
  return () => window.clearInterval(interval);
}

function getClockSnapshot() {
  return Math.floor(Date.now() / TICK_MS);
}

function getServerClockSnapshot() {
  return 0;
}

/** Current time, refreshed every 15 seconds; null while rendering on the server. */
function useNow() {
  const tick = useSyncExternalStore(
    subscribeToClock,
    getClockSnapshot,
    getServerClockSnapshot,
  );
  return useMemo(() => (tick === 0 ? null : new Date(tick * TICK_MS)), [tick]);
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour = hours % 12 || 12;
  return `${hour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function capitalizeFirst(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function periodIcon(period: Dose["period"]) {
  if (period === "Morning") return "wb_sunny";
  if (period === "Lunch") return "restaurant";
  return "bedtime";
}

function todayLabel(now: Date | null) {
  if (!now) return "";
  const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(now);
  const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" }).format(now);
  return `${weekday}, ${dayMonth}`;
}

/** A soft two-note chime when a reminder appears. Browsers may block sound
 *  until Jeanne has touched the page once; the reminder still shows. */
function playChime() {
  try {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    [660, 880].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * 0.35;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.6);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.65);
    });
    window.setTimeout(() => context.close(), 1500);
  } catch {
    // No audio available: the visual reminder is enough.
  }
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-GB";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

function doseStatusLabel(dose: MamieDose, now: Date | null) {
  if (dose.status === "taken") {
    return {
      text: dose.takenAt ? `Taken at ${formatClock(dose.takenAt)}` : "Taken",
      tone: "bg-secondary-container text-on-secondary-container",
    };
  }
  if (dose.status === "missed") {
    return { text: "Missed", tone: "bg-error-container text-on-error-container" };
  }
  if (now && dose.snoozedUntil && new Date(dose.snoozedUntil) > now) {
    return {
      text: `Reminder at ${formatClock(dose.snoozedUntil)}`,
      tone: "bg-tertiary-fixed text-on-tertiary-fixed",
    };
  }
  if (now && dueAt(dose, now) <= now) {
    return { text: "Time to take", tone: "bg-tertiary-fixed text-on-tertiary-fixed" };
  }
  return { text: "Later today", tone: "bg-surface-container-high text-on-surface-variant" };
}

function DoseRow({ dose, now }: { dose: MamieDose; now: Date | null }) {
  const status = doseStatusLabel(dose, now);
  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
            {periodIcon(dose.period)}
          </span>
        </span>
        <div className="min-w-0">
          <p className="font-headline text-[20px] font-bold leading-snug text-on-surface">
            {dose.period} · {formatTime(dose.time)}
          </p>
          <p className="mt-1 text-[20px] font-semibold leading-snug text-on-surface">
            {dose.medication}
          </p>
          <p className="mt-1 text-[18px] leading-snug text-on-surface-variant">
            {[dose.dosage, dose.instructions, capitalizeFirst(dose.timing)]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {dose.appearance ? (
            <p className="mt-1 text-[18px] leading-snug text-on-surface-variant">
              Looks like: {dose.appearance}
            </p>
          ) : null}
        </div>
      </div>
      <span
        className={`self-start whitespace-nowrap rounded-full px-3 py-1 text-[18px] font-semibold ${status.tone}`}
      >
        {status.text}
      </span>
    </li>
  );
}

function QuickCallCard({
  member,
  index,
}: {
  member: CallMember;
  index: number;
}) {
  const tone =
    index % 2 === 0
      ? "bg-secondary-fixed text-on-secondary-fixed"
      : "bg-tertiary-fixed text-on-tertiary-fixed";

  return (
    <a
      href={telHref(member.phone)}
      aria-label={`Call ${member.name}`}
      className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-surface-container-lowest p-4 text-center shadow-sm transition-all hover:bg-surface-container-low active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:min-h-16 lg:flex-row lg:items-center lg:justify-between lg:bg-surface-container-low lg:p-4 lg:text-left"
    >
      <span className="flex flex-col items-center gap-2 lg:flex-row lg:gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm ${tone}`}
        >
          <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
            call
          </span>
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-headline text-[20px] font-bold leading-tight text-on-surface">
            Call {member.name}
          </span>
          <span className="hidden text-[18px] leading-tight text-on-surface-variant lg:block">
            {[member.role, member.city].filter(Boolean).join(" · ")}
          </span>
        </span>
      </span>
      <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container lg:flex">
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
          arrow_forward
        </span>
      </span>
    </a>
  );
}

export function MamieCare({
  doses: serverDoses,
  members,
  familyNotes,
  familyName,
  live,
  weather,
  garden,
}: {
  /** Today's doses with their reminder state, earliest first. */
  doses: MamieDose[];
  members: CallMember[];
  /** Low-stock alerts and who in the family is handling each one. */
  familyNotes: FamilyNote[];
  /** Main caregiver, named in the reminder ("Lavanya will be told"). */
  familyName: string;
  /** false = API unreachable: demo doses, actions only change this screen. */
  live: boolean;
  /** Live weather for her town; hidden when the weather service is down. */
  weather: Weather | null;
  /** This week's plant and the garden of past weeks. */
  garden: ApiGarden | null;
}) {
  const router = useRouter();
  const now = useNow();
  const isClient = useSyncExternalStore(subscribeToClient, getIsClient, getIsServer);
  // Applied on top of the server data until the next refresh confirms it.
  const [overrides, setOverrides] = useState<Record<string, Partial<MamieDose>>>({});
  const [justTaken, setJustTaken] = useState<MamieDose | null>(null);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!readProfile()) saveProfile(demoData.mamie.profile);
  }, []);

  const doses = useMemo(
    () =>
      serverDoses.map((dose) => {
        const override = overrides[dose.id];
        // Once the server has moved on (taken / missed), it wins.
        return override && dose.status === "pending" ? { ...dose, ...override } : dose;
      }),
    [serverDoses, overrides],
  );

  const reminder = now ? reminderDose(doses, now) : undefined;
  const pendingDoses = doses.filter((dose) => dose.status === "pending");
  const nextDose = reminder ?? pendingDoses[0];
  const allTaken = doses.length > 0 && doses.every((dose) => dose.status === "taken");
  // The plant grows when every scheduled ("as needed" excluded) medicine is taken.
  const countedDoses = doses.filter((dose) => !dose.asNeeded);
  const todayComplete =
    countedDoses.length > 0 && countedDoses.every((dose) => dose.status === "taken");
  const missedCount = doses.filter((dose) => dose.status === "missed").length;
  const canTakeNext =
    nextDose !== undefined && now !== null && dueAt(nextDose, now).getTime() - EARLY_TAKE_MS <= now.getTime();
  const quickCallMembers = members.filter((member) => member.role !== "Home nurse");
  const quickCallNames = quickCallMembers.map((member) => member.name).join(" or ");
  const label = todayLabel(now);
  const todayShort = label.split(", ")[1] ?? "";

  // Chime each time a reminder (or a snoozed one coming back) appears.
  const reminderKey = reminder ? `${reminder.id}:${reminder.snoozesLeft}` : null;
  useEffect(() => {
    if (reminderKey) playChime();
  }, [reminderKey]);

  const closeCallDialog = useCallback(() => setCallDialogOpen(false), []);
  const openCallDialog = useCallback(() => setCallDialogOpen(true), []);

  const applyAction = useCallback(
    async (dose: MamieDose, action: "take" | "snooze") => {
      setBusy(true);
      setSaveError(null);
      try {
        if (live) {
          await (action === "take" ? markDoseTaken : snoozeDose)(Number(dose.id));
        }
        const stamp = new Date();
        setOverrides((current) => ({
          ...current,
          [dose.id]:
            action === "take"
              ? { status: "taken", takenAt: stamp.toISOString() }
              : {
                  snoozesLeft: dose.snoozesLeft - 1,
                  snoozedUntil: new Date(stamp.getTime() + SNOOZE_MINUTES * 60_000).toISOString(),
                },
        }));
        if (action === "take") setJustTaken(dose);
        if (live) router.refresh();
      } catch {
        setSaveError("That did not go through. Please try again, or call your family.");
        if (live) router.refresh();
      } finally {
        setBusy(false);
      }
    },
    [live, router],
  );

  const handleTake = useCallback(() => {
    if (nextDose) void applyAction(nextDose, "take");
  }, [applyAction, nextDose]);

  const handleTakeReminder = useCallback(() => {
    if (reminder) void applyAction(reminder, "take");
  }, [applyAction, reminder]);

  const handleSnooze = useCallback(() => {
    if (reminder && reminder.snoozesLeft > 0) void applyAction(reminder, "snooze");
  }, [applyAction, reminder]);

  const handleListen = useCallback(() => {
    const dose = reminder ?? nextDose;
    if (!dose) return;
    const strengthMatch = dose.medication.match(/(\d+)\s*mg/i);
    const medicationName = dose.medication.replace(/\s+\d+\s*mg/i, "").trim();
    const detail = dose.instructions ?? dose.timing;
    const spokenDosage = dose.dosage.replace(/^1\s+/, "One ");
    const spokenDetail = capitalizeFirst(`${spokenDosage} ${detail}`.trim());
    const strength = strengthMatch ? `, ${strengthMatch[1]} milligrams` : "";
    speak(`${firstName}, it's time for your ${medicationName}${strength}. ${spokenDetail}.`);
  }, [reminder, nextDose]);

  function handleReset() {
    setOverrides({});
    setJustTaken(null);
  }

  return (
    <main className="min-h-dvh bg-background px-5 pb-24 pt-6 md:px-12 xl:pb-0">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:rounded-lg md:bg-surface-container-low md:p-8 md:shadow-sm">
            <div className="flex flex-col gap-2">
              <span className="text-[18px] font-semibold text-secondary">
                {label || " "}
              </span>
              <h1 className="font-headline text-[30px] font-bold leading-tight tracking-tight text-on-surface md:text-[40px]">
                Good morning, {firstName}!
              </h1>
              <p className="max-w-2xl text-[20px] leading-relaxed text-on-surface-variant">
                Take your time today. We will remind you when it is time for
                each medicine.
              </p>
            </div>

            {weather ? (
              <div
                className="inline-flex items-center gap-3 self-start rounded-full bg-surface-container-lowest px-4 py-3 shadow-sm"
                aria-label={`Weather in ${weather.city}: ${weather.temperature} degrees, ${weather.condition}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
                  <span
                    className="material-symbols-outlined text-[26px]"
                    aria-hidden="true"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {weather.icon}
                  </span>
                </span>
                <span className="flex flex-col" aria-hidden="true">
                  <span className="whitespace-nowrap font-headline text-[20px] font-bold leading-tight text-on-surface">
                    {weather.temperature}°C · {weather.condition}
                  </span>
                  <span className="whitespace-nowrap text-[18px] leading-tight text-on-surface-variant">
                    {weather.city} · {weather.min}° to {weather.max}° today
                  </span>
                </span>
              </div>
            ) : null}
          </div>

          {familyNotes.map((note) => (
            <div
              key={note.id}
              className={`flex items-center gap-3 rounded-lg p-4 shadow-sm ${
                note.acknowledged ? "bg-secondary-container/50" : "bg-tertiary-fixed/40"
              }`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                  note.acknowledged
                    ? "bg-primary text-on-primary"
                    : "bg-tertiary-fixed text-on-tertiary-fixed"
                }`}
              >
                <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
                  {note.acknowledged ? "volunteer_activism" : "inventory_2"}
                </span>
              </span>
              <div className="flex flex-col">
                <span className="text-[18px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  {note.acknowledged ? "Note from family" : "Medicine running low"}
                </span>
                <p className="font-headline text-[20px] font-medium leading-snug text-on-surface">
                  {note.text}
                </p>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <section className="flex flex-col gap-5 rounded-lg bg-surface-container-lowest p-5 shadow-md lg:p-8">
              {justTaken ? (
                <div className="flex items-center gap-3 rounded-2xl bg-secondary-container p-4 text-on-secondary-container">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                    <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
                      thumb_up
                    </span>
                  </span>
                  <div className="flex flex-col">
                    <p className="font-headline text-[20px] font-bold">
                      Well done, {firstName}!
                    </p>
                    <p className="text-[18px] leading-snug">
                      {justTaken.medication} recorded. Your family has been
                      updated.
                    </p>
                  </div>
                </div>
              ) : null}

              {saveError ? (
                <p
                  role="alert"
                  className="rounded-2xl bg-error-container p-4 text-[20px] font-semibold text-on-error-container"
                >
                  {saveError}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-2 text-[18px] font-bold text-on-secondary-container">
                  <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                    {nextDose ? "alarm" : "check_circle"}
                  </span>
                  {nextDose
                    ? canTakeNext
                      ? `Time for your ${nextDose.period.toLowerCase()} medicine`
                      : `Next medicine · ${formatTime(nextDose.time)} (${nextDose.period})`
                    : "No more medicines today"}
                </span>

                {nextDose ? (
                  <button
                    type="button"
                    onClick={handleListen}
                    aria-label="Listen to the next medicine out loud"
                    className="flex min-h-14 items-center gap-2 rounded-full bg-surface-container-low px-4 text-[18px] font-semibold text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span className="material-symbols-outlined text-[22px] text-primary" aria-hidden="true">
                      volume_up
                    </span>
                    Listen out loud
                  </button>
                ) : null}
              </div>

              {nextDose ? (
                <>
                  <div className="flex flex-col gap-2">
                    <h2 className="font-headline text-[30px] font-bold leading-tight tracking-tight text-primary lg:text-[40px]">
                      {nextDose.medication}
                    </h2>
                    <p className="text-[20px] leading-relaxed text-on-surface-variant">
                      <span className="font-semibold text-on-surface">{nextDose.dosage}</span>{" "}
                      {nextDose.instructions ?? nextDose.timing}
                    </p>
                    {nextDose.instructions ? (
                      <p className="flex items-center gap-2 text-[18px] text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                          schedule
                        </span>
                        <span>{capitalizeFirst(nextDose.timing)}</span>
                      </p>
                    ) : null}
                  </div>

                  {nextDose.appearance ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-container-lowest text-primary shadow-sm">
                        <span className="material-symbols-outlined text-[30px]" aria-hidden="true">
                          receipt_long
                        </span>
                      </span>
                      <div className="flex min-w-0 flex-col">
                        <span className="text-[18px] font-semibold uppercase tracking-wide text-on-surface-variant">
                          Packaging look
                        </span>
                        <span className="mt-0.5 font-headline text-[24px] font-bold capitalize leading-snug text-on-surface">
                          {nextDose.appearance}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {canTakeNext ? (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={handleTake}
                        disabled={busy}
                        className="flex min-h-16 w-full items-center justify-center gap-3 rounded-full bg-primary-container px-6 py-4 text-[20px] font-bold text-on-primary shadow-md transition-all hover:bg-primary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[32px]" aria-hidden="true">
                          check_circle
                        </span>
                        <span>I have taken my medicine</span>
                      </button>
                      <p className="text-center text-[18px] text-on-surface-variant">
                        Tap the green button after taking your medicine.
                      </p>
                    </div>
                  ) : (
                    <p className="rounded-2xl bg-surface-container-low p-4 text-center text-[20px] text-on-surface-variant">
                      We will remind you at {formatTime(nextDose.time)}.
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                    <span className="material-symbols-outlined text-[44px]" aria-hidden="true">
                      check_circle
                    </span>
                  </span>
                  <h2 className="font-headline text-[30px] font-bold text-on-surface">
                    {allTaken ? "All done for today!" : "No more medicines today"}
                  </h2>
                  <p className="max-w-md text-[20px] leading-relaxed text-on-surface-variant">
                    {allTaken
                      ? "You have taken all your medicines. Your plant grew a little today!"
                      : missedCount > 0
                        ? "Your family knows about the medicine you missed. Rest well."
                        : "Nothing is planned for today."}
                  </p>
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4 rounded-lg bg-surface-container-low p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-headline text-[20px] font-bold text-on-surface">
                  Today&apos;s medicines
                </h2>
                <span className="text-[18px] font-semibold text-secondary">{todayShort}</span>
              </div>
              {doses.length === 0 ? (
                <p className="text-[20px] text-on-surface-variant">
                  No medicine is planned for today.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {doses.map((dose) => (
                    <DoseRow key={dose.id} dose={dose} now={now} />
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <ReminderNotifications />

            <section
              aria-labelledby="new-prescription-title"
              className="flex flex-col gap-3 rounded-lg bg-surface-container-lowest p-5 shadow-md"
            >
              <div className="flex flex-col gap-1">
                <h2
                  id="new-prescription-title"
                  className="font-headline text-[22px] font-bold leading-tight text-on-surface"
                >
                  New prescription from the doctor?
                </h2>
                <p className="text-[18px] leading-snug text-on-surface-variant">
                  Take a photo of it and check your tablets.
                </p>
              </div>
              <Link
                href="/prescriptions"
                className="flex min-h-16 w-full items-center justify-center gap-3 rounded-full bg-primary-container px-6 text-[20px] font-bold text-on-primary shadow-md transition-all hover:bg-primary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
                  add_a_photo
                </span>
                Add a prescription
              </Link>
            </section>

            <PlantCompanion garden={garden} todayComplete={todayComplete} />

            <section className="flex flex-col gap-3 lg:rounded-lg lg:bg-surface-container-lowest lg:p-5 lg:shadow-md">
              <div className="flex flex-col gap-1">
                <h2 className="font-headline text-[20px] font-bold text-on-surface lg:text-[24px]">
                  Call your loved ones
                </h2>
                <p className="hidden text-[18px] text-on-surface-variant lg:block">
                  One simple tap connects you immediately.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:flex lg:flex-col lg:gap-3">
                {quickCallMembers.map((member, index) => (
                  <QuickCallCard key={member.id} member={member} index={index} />
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="rounded-lg bg-error-container/70 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3 md:items-center">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-error text-on-error shadow-sm">
                <span className="material-symbols-outlined text-[30px]" aria-hidden="true">
                  support_agent
                </span>
              </span>
              <div className="flex flex-col">
                <h2 className="font-headline text-[24px] font-bold leading-snug text-on-error-container">
                  Need help? Call {quickCallNames || "your family"} in one tap.
                </h2>
                <p className="text-[20px] leading-snug text-on-error-container">
                  If you feel unwell, call the emergency number {EMERGENCY_NUMBER}.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={openCallDialog}
                aria-haspopup="dialog"
                className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-surface-container-lowest px-6 text-[20px] font-bold text-on-error-container shadow-md transition-all hover:bg-surface-container-low active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-error-container"
              >
                <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                  call
                </span>
                Call my family
              </button>
              <a
                href={telHref(EMERGENCY_NUMBER)}
                aria-label={`Call emergency services, ${EMERGENCY_NUMBER}`}
                className="flex min-h-14 items-center justify-center gap-2 rounded-full bg-error px-6 text-[20px] font-bold text-on-error shadow-md transition-all hover:bg-on-error-container active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-error-container"
              >
                <span className="material-symbols-outlined text-[24px]" aria-hidden="true">
                  emergency
                </span>
                Emergency · {EMERGENCY_NUMBER}
              </a>
            </div>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-center gap-2 rounded-lg bg-surface-container-low px-5 py-5 text-center text-[18px] text-on-surface-variant sm:flex-row sm:gap-3">
          <p>© 2026 MamieMedoc · Not a medical device</p>
          {live ? null : (
            <button
              type="button"
              onClick={handleReset}
              className="font-semibold text-primary underline decoration-2 underline-offset-4 transition-colors hover:text-on-secondary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Reset demo
            </button>
          )}
        </footer>
      </div>

      <CallFamilyDialog open={callDialogOpen} members={members} onClose={closeCallDialog} />

      {isClient && reminder && !callDialogOpen ? (
        <DoseReminder
          dose={reminder}
          familyName={familyName}
          busy={busy}
          onTake={handleTakeReminder}
          onRemind={handleSnooze}
          onListen={handleListen}
          onCallFamily={openCallDialog}
        />
      ) : null}
    </main>
  );
}
