"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { CallFamilyDialog } from "./CallFamilyDialog";
import { DoseReminder } from "./DoseReminder";
import { PlantCompanion } from "./PlantCompanion";
import { demoData, type Dose, type FamilyMember } from "@/lib/demo-data";
import {
  clearTakenDoses,
  getDoseSnapshot,
  parseDoseSnapshot,
  saveTakenDoses,
  subscribeToDoseChanges,
} from "@/lib/doses";
import { telHref } from "@/lib/phone";
import { readProfile, saveProfile } from "@/lib/profile";

const firstName = demoData.mamie.name.split(" ")[0];
const plantFirstName = demoData.plant.name.split(" ")[0];
const quickCallMembers = demoData.members.filter(
  (member) => member.role !== "Home nurse",
);
const quickCallNames = quickCallMembers
  .map((member) => member.name)
  .join(" or ");

type ReminderState = "pending" | "snoozed" | "closed";

function subscribeToClient() {
  return () => {};
}

function getIsClient() {
  return true;
}

function getIsServer() {
  return false;
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

function getTodaySnapshot() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
  }).format(now);
  const dayMonth = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
  }).format(now);
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;
  return `${weekday}, ${dayMonth}|${key}`;
}

function subscribeToDayChange(onStoreChange: () => void) {
  const interval = window.setInterval(onStoreChange, 60_000);
  return () => window.clearInterval(interval);
}

function getEmptyTodaySnapshot() {
  return "";
}

function useToday() {
  const snapshot = useSyncExternalStore(
    subscribeToDayChange,
    getTodaySnapshot,
    getEmptyTodaySnapshot,
  );
  const [label, key] = snapshot ? snapshot.split("|") : ["", ""];
  return { label, key };
}

function getEmptyDoseSnapshot() {
  return "[]";
}

function useTakenDoses(dateKey: string) {
  const getSnapshot = useCallback(
    () => (dateKey ? getDoseSnapshot(dateKey) : "[]"),
    [dateKey],
  );
  const snapshot = useSyncExternalStore(
    subscribeToDoseChanges,
    getSnapshot,
    getEmptyDoseSnapshot,
  );
  return useMemo(() => parseDoseSnapshot(snapshot), [snapshot]);
}

function DoseRow({ dose, taken }: { dose: Dose; taken: boolean }) {
  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
          <span
            className="material-symbols-outlined text-[22px]"
            aria-hidden="true"
          >
            {periodIcon(dose.period)}
          </span>
        </span>
        <div className="min-w-0">
          <p className="font-headline text-[20px] font-bold leading-snug text-on-surface">
            {dose.period} · {formatTime(dose.time)}
          </p>
          <p className="mt-1 text-[18px] leading-snug text-on-surface-variant">
            {dose.medication} ({dose.dosage}) ·{" "}
            {capitalizeFirst(dose.timing)}
          </p>
        </div>
      </div>
      <span
        className={`self-start rounded-full px-3 py-1 text-[18px] font-semibold ${
          taken
            ? "bg-secondary-container text-on-secondary-container"
            : "bg-surface-container-high text-on-surface-variant"
        }`}
      >
        {taken ? "Taken" : "Scheduled"}
      </span>
    </li>
  );
}

function QuickCallCard({
  member,
  index,
}: {
  member: FamilyMember;
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
          <span
            className="material-symbols-outlined text-[26px]"
            aria-hidden="true"
          >
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
        <span
          className="material-symbols-outlined text-[22px]"
          aria-hidden="true"
        >
          arrow_forward
        </span>
      </span>
    </a>
  );
}

export function MamieCare() {
  const { label: todayLabel, key: dateKey } = useToday();
  const takenIds = useTakenDoses(dateKey);
  const isClient = useSyncExternalStore(
    subscribeToClient,
    getIsClient,
    getIsServer,
  );
  const [justTaken, setJustTaken] = useState<Dose | null>(null);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [reminderState, setReminderState] =
    useState<ReminderState>("pending");
  const snoozeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!readProfile()) saveProfile(demoData.mamie.profile);
  }, []);

  useEffect(() => {
    return () => {
      if (snoozeTimer.current) window.clearTimeout(snoozeTimer.current);
    };
  }, []);

  const closeCallDialog = useCallback(() => setCallDialogOpen(false), []);

  const handleRemind = useCallback(() => {
    setReminderState("snoozed");
    setCallDialogOpen(false);

    if (snoozeTimer.current) {
      window.clearTimeout(snoozeTimer.current);
    }

    snoozeTimer.current = window.setTimeout(() => {
      setCallDialogOpen(false);
      setReminderState((current) =>
        current === "snoozed" ? "pending" : current,
      );
      snoozeTimer.current = null;
    }, 10_000);
  }, []);

  const nextDose = demoData.todaysDoses.find(
    (dose) => !takenIds.includes(dose.id),
  );
  const allTaken = nextDose === undefined;
  const restDoses = nextDose
    ? demoData.todaysDoses.filter((dose) => dose.id !== nextDose.id)
    : demoData.todaysDoses;
  const todayShort = todayLabel.split(", ")[1] ?? "";
  const reminderOpen =
    isClient &&
    Boolean(dateKey) &&
    reminderState === "pending" &&
    nextDose !== undefined;

  function clearSnoozeTimer() {
    if (snoozeTimer.current) {
      window.clearTimeout(snoozeTimer.current);
      snoozeTimer.current = null;
    }
  }

  function handleTakeDose() {
    if (!nextDose || !dateKey) return;
    saveTakenDoses(dateKey, [...takenIds, nextDose.id]);
    setJustTaken(nextDose);
    setReminderState("closed");
    clearSnoozeTimer();
  }

  function handleReset() {
    clearTakenDoses(dateKey);
    setJustTaken(null);
    setReminderState("closed");
    clearSnoozeTimer();
  }

  function handleListen() {
    if (
      !nextDose ||
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      return;
    }

    const strengthMatch = nextDose.medication.match(/(\d+)\s*mg/i);
    const medicationName = nextDose.medication
      .replace(/\s+\d+\s*mg/i, "")
      .trim();
    const detail = nextDose.instructions ?? nextDose.timing;
    const spokenDosage = nextDose.dosage.replace(/^1\s+/, "One ");
    const spokenDetail = capitalizeFirst(
      `${spokenDosage} ${detail}`.trim(),
    );
    const strength = strengthMatch ? `, ${strengthMatch[1]} milligrams` : "";
    const text = `${firstName}, it's time for your ${medicationName}${strength}. ${spokenDetail}.`;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="min-h-dvh bg-background px-5 pb-24 pt-6 md:px-12 xl:pb-0">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:rounded-lg md:bg-surface-container-low md:p-8 md:shadow-sm">
            <div className="flex flex-col gap-2">
              <span className="text-[18px] font-semibold text-secondary">
                {todayLabel || "\u00A0"}
              </span>
              <h1 className="font-headline text-[30px] font-bold leading-tight tracking-tight text-on-surface md:text-[40px]">
                Good morning, {firstName}!
              </h1>
              <p className="max-w-2xl text-[20px] leading-relaxed text-on-surface-variant">
                Take your time today. We have everything prepared for your
                morning routine.
              </p>
            </div>

            <div className="inline-flex items-center gap-3 self-start rounded-full bg-surface-container-lowest px-4 py-3 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
                <span
                  className="material-symbols-outlined text-[26px]"
                  aria-hidden="true"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  wb_sunny
                </span>
              </span>
              <span className="flex flex-col">
                <span className="whitespace-nowrap font-headline text-[20px] font-bold leading-tight text-on-surface">
                  {demoData.weather.label}
                </span>
                <span className="text-[18px] leading-tight text-on-surface-variant">
                  {demoData.weather.city}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-tertiary-fixed/40 p-4 shadow-sm">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
              <span
                className="material-symbols-outlined text-[28px]"
                aria-hidden="true"
              >
                mark_email_read
              </span>
            </span>
            <div className="flex flex-col">
              <span className="text-[18px] font-semibold uppercase tracking-wide text-on-tertiary-fixed-variant">
                Note from family
              </span>
              <p className="font-headline text-[20px] font-medium leading-snug text-on-tertiary-fixed">
                {demoData.refill.message}
              </p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <section className="flex flex-col gap-5 rounded-lg bg-surface-container-lowest p-5 shadow-md lg:p-8">
              {justTaken ? (
                <div className="flex items-center gap-3 rounded-2xl bg-secondary-container p-4 text-on-secondary-container">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                    <span
                      className="material-symbols-outlined text-[28px]"
                      aria-hidden="true"
                    >
                      thumb_up
                    </span>
                  </span>
                  <div className="flex flex-col">
                    <p className="font-headline text-[20px] font-bold">
                      Well done, {firstName}!
                    </p>
                    <p className="text-[18px] leading-snug">
                      {capitalizeFirst(justTaken.period)} dose recorded. Your
                      family has been updated.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-4 py-2 text-[18px] font-bold text-on-secondary-container">
                  <span
                    className="material-symbols-outlined text-[22px]"
                    aria-hidden="true"
                  >
                    {allTaken ? "check_circle" : "alarm"}
                  </span>
                  {nextDose
                    ? `Next dose · ${formatTime(nextDose.time)} (${nextDose.period})`
                    : "All doses taken"}
                </span>

                {nextDose ? (
                  <button
                    type="button"
                    onClick={handleListen}
                    aria-label="Listen to the next dose out loud"
                    className="flex min-h-14 items-center gap-2 rounded-full bg-surface-container-low px-4 text-[18px] font-semibold text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span
                      className="material-symbols-outlined text-[22px] text-primary"
                      aria-hidden="true"
                    >
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
                      <span className="font-semibold text-on-surface">
                        {nextDose.dosage}
                      </span>{" "}
                      {nextDose.instructions ?? nextDose.timing}
                    </p>
                    {nextDose.instructions ? (
                      <p className="flex items-center gap-2 text-[18px] text-on-surface-variant">
                        <span
                          className="material-symbols-outlined text-[18px]"
                          aria-hidden="true"
                        >
                          schedule
                        </span>
                        <span>{capitalizeFirst(nextDose.timing)}</span>
                      </p>
                    ) : null}
                  </div>

                  {nextDose.appearance ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4">
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface-container-lowest text-primary shadow-sm">
                        <span
                          className="material-symbols-outlined text-[30px]"
                          aria-hidden="true"
                        >
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

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleTakeDose}
                      className="flex min-h-16 w-full items-center justify-center gap-3 rounded-full bg-primary-container px-6 py-4 text-[20px] font-bold text-on-primary shadow-md transition-all hover:bg-primary active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      <span
                        className="material-symbols-outlined text-[32px]"
                        aria-hidden="true"
                      >
                        check_circle
                      </span>
                      <span>I have taken my medicine</span>
                    </button>
                    <p className="text-center text-[18px] text-on-surface-variant">
                      Tap the green button after taking your medicine.
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-4 text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                    <span
                      className="material-symbols-outlined text-[44px]"
                      aria-hidden="true"
                    >
                      check_circle
                    </span>
                  </span>
                  <h2 className="font-headline text-[30px] font-bold text-on-surface">
                    All done for today!
                  </h2>
                  <p className="max-w-md text-[20px] leading-relaxed text-on-surface-variant">
                    You have taken all your medicines. {plantFirstName} has a
                    new leaf!
                  </p>
                </div>
              )}
            </section>

            <section className="flex flex-col gap-4 rounded-lg bg-surface-container-low p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-headline text-[20px] font-bold text-on-surface">
                  Rest of Today
                </h2>
                <span className="text-[18px] font-semibold text-secondary">
                  {todayShort}
                </span>
              </div>
              <ul className="flex flex-col gap-3">
                {restDoses.map((dose) => (
                  <DoseRow
                    key={dose.id}
                    dose={dose}
                    taken={takenIds.includes(dose.id)}
                  />
                ))}
              </ul>
            </section>
          </div>

          <div className="flex flex-col gap-6 lg:col-span-5">
            <PlantCompanion allTaken={allTaken} />

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
                  <QuickCallCard
                    key={member.id}
                    member={member}
                    index={index}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="rounded-lg bg-error-container/70 p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3 md:items-center">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-error text-on-error shadow-sm">
                <span
                  className="material-symbols-outlined text-[30px]"
                  aria-hidden="true"
                >
                  support_agent
                </span>
              </span>
              <div className="flex flex-col">
                <h2 className="font-headline text-[24px] font-bold leading-snug text-on-error-container">
                  Need help? Call {quickCallNames} in one tap.
                </h2>
                <p className="text-[20px] leading-snug text-on-error-container">
                  We are here at any moment of the day or night.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCallDialogOpen(true)}
              aria-haspopup="dialog"
              className="flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-error px-6 text-[20px] font-bold text-on-error shadow-md transition-all hover:bg-on-error-container active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-error-container"
            >
              <span
                className="material-symbols-outlined text-[24px]"
                aria-hidden="true"
              >
                call
              </span>
              Call my family
            </button>
          </div>
        </section>

        <footer className="flex flex-col items-center justify-center gap-2 rounded-lg bg-surface-container-low px-5 py-5 text-center text-[18px] text-on-surface-variant sm:flex-row sm:gap-3">
          <p>
            © 2026 MamieMedoc · Demo with invented data · Not a medical device
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="font-semibold text-primary underline decoration-2 underline-offset-4 transition-colors hover:text-on-secondary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Reset demo
          </button>
        </footer>
      </div>

      <CallFamilyDialog open={callDialogOpen} onClose={closeCallDialog} />

      {reminderOpen && nextDose ? (
        <DoseReminder
          dose={nextDose}
          onTake={handleTakeDose}
          onRemind={handleRemind}
          onListen={handleListen}
        />
      ) : null}
    </main>
  );
}
