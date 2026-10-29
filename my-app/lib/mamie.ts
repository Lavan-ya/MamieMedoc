// Jeanne's care view: one dose with its reminder state, and her contacts.
import type { ApiCareCircleDose, ApiFamilyMember, ApiStockAlert } from "./api";
import { demoData, type Dose, type DosePeriod } from "./demo-data";

/** Must match MAX_SNOOZES / SNOOZE_MINUTES in api/src/common/reminders.ts. */
export const MAX_SNOOZES = 3;
export const SNOOZE_MINUTES = 15;

/** French medical emergency number (SAMU); 112 works everywhere in Europe. */
export const EMERGENCY_NUMBER = "15";
export const EUROPEAN_EMERGENCY_NUMBER = "112";

export type MamieDose = Dose & {
  status: "pending" | "taken" | "missed";
  /** ISO time the dose was confirmed. */
  takenAt?: string;
  /** ISO time until which the reminder is snoozed. */
  snoozedUntil?: string | null;
  snoozesLeft: number;
  /** "Si douleur" medicines do not count towards the plant. */
  asNeeded?: boolean;
};

/** A message on Jeanne's screen about her medicine stock. */
export type FamilyNote = {
  id: string;
  text: string;
  /** true = a family member said they will handle it. */
  acknowledged: boolean;
};

/** Low stock: who will bring the refill, or reassurance that the family knows. */
export function stockAlertNotes(alerts: ApiStockAlert[]): FamilyNote[] {
  return alerts.map((alert) => ({
    id: String(alert.medicationId),
    acknowledged: alert.refill !== null,
    text: alert.refill
      ? `${alert.refill.by} will help you refill your ${alert.medication}, bringing it ${alert.refill.plannedFor.toLowerCase()}.`
      : `Your ${alert.medication} is running low (${alert.stockDoses} ${alert.unit} left). Your family has been told.`,
  }));
}

export function demoNotes(): FamilyNote[] {
  return [{ id: "demo", text: demoData.refill.message, acknowledged: true }];
}

export type CallMember = {
  id: string;
  name: string;
  role: string;
  city?: string;
  phone: string;
  image: string;
};

const PERIODS: Record<ApiCareCircleDose["timeOfDay"], DosePeriod> = {
  MORNING: "Morning",
  MIDDAY: "Lunch",
  EVENING: "Evening",
  BEDTIME: "Evening",
};

export function toMamieDose(dose: ApiCareCircleDose): MamieDose {
  return {
    id: String(dose.id),
    time: dose.time,
    period: PERIODS[dose.timeOfDay],
    medication: dose.medication,
    dosage: dose.dosage,
    instructions: dose.instruction,
    timing: dose.mealInstruction ?? PERIODS[dose.timeOfDay].toLowerCase(),
    appearance: dose.appearance ?? undefined,
    stockLeft: dose.stockLeft,
    stockUnit: dose.stockUnit,
    status: dose.status === "TAKEN" ? "taken" : dose.status === "MISSED" ? "missed" : "pending",
    takenAt: dose.takenAt ?? undefined,
    snoozedUntil: dose.snoozedUntil,
    snoozesLeft: dose.snoozesLeft,
    asNeeded: dose.asNeeded,
  };
}

export function toCallMember(member: ApiFamilyMember): CallMember {
  return {
    id: String(member.id),
    name: member.firstName,
    role: member.relation,
    phone: member.phone,
    image: member.avatarUrl ?? "/images/jeanne.jpg",
  };
}

/** Used when the API is unreachable, so the page still demonstrates the flow. */
export function demoDoses(): MamieDose[] {
  return demoData.todaysDoses.map((dose) => ({
    ...dose,
    status: "pending",
    snoozedUntil: null,
    snoozesLeft: MAX_SNOOZES,
  }));
}

/** Today's date at the dose's "HH:MM", in the device's local time. */
export function dueAt(dose: Pick<Dose, "time">, now: Date) {
  const [hours, minutes] = dose.time.split(":").map(Number);
  const due = new Date(now);
  due.setHours(hours, minutes, 0, 0);
  return due;
}

/** The dose whose reminder should be on screen now, if any (earliest first). */
export function reminderDose(doses: MamieDose[], now: Date) {
  return doses.find(
    (dose) =>
      dose.status === "pending" &&
      dueAt(dose, now) <= now &&
      (!dose.snoozedUntil || new Date(dose.snoozedUntil) <= now),
  );
}

export function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
