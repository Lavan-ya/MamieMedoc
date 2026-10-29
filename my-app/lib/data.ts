import {
  apiFileUrl,
  type ApiMedication,
  type ApiPrescription,
  type ApiStockItem,
  type TimeOfDay,
} from "./api";

export type DoseStatus = "taken" | "pending" | "missed" | "scheduled";

export type Dose = {
  id: string;
  time: string;
  period: string;
  name: string;
  dosage: string;
  instructions: string;
  status: DoseStatus;
  takenAt?: string;
  /** Who confirmed the dose: a family member's first name, or undefined for Jeanne. */
  takenBy?: string;
};

export type ToastMessage = {
  id: number;
  message: string;
};

export const INITIAL_DOSES: Dose[] = [
  {
    id: "kordegic",
    time: "08:00",
    period: "Morning",
    name: "Kordegic",
    dosage: "75 mg",
    instructions: "1 sachet dissolved in water with breakfast",
    status: "taken",
    takenAt: "08:14",
  },
  {
    id: "metformin",
    time: "12:30",
    period: "Lunch",
    name: "Metformin",
    dosage: "500 mg",
    instructions: "1 tablet with meal to support balanced digestion",
    status: "pending",
  },
  {
    id: "doliprane",
    time: "19:30",
    period: "Evening",
    name: "Doliprane",
    dosage: "1000 mg",
    instructions: "1 tablet if pain persists in evening (optional)",
    status: "scheduled",
  },
];

export type StockItem = {
  name: string;
  remaining: string;
  days: string;
  status: "healthy" | "low";
};

export const STOCK_ITEMS: StockItem[] = [
  {
    name: "Kordegic 75 mg",
    remaining: "21 sachets left",
    days: "21 days remaining",
    status: "healthy",
  },
  {
    name: "Metformin 500 mg",
    remaining: "5 tablets left",
    days: "5 days remaining",
    status: "low",
  },
  {
    name: "Doliprane 1000 mg",
    remaining: "14 tablets left",
    days: "14 days remaining",
    status: "healthy",
  },
];

/** Home stock from the API -> the inventory card rows. */
export function toStockItem(item: ApiStockItem): StockItem {
  return {
    name: `${item.name} ${item.strength}`,
    remaining: `${item.stockDoses} ${item.unit} left`,
    days: item.daysLeft === null ? "Not scheduled" : `${item.daysLeft} days remaining`,
    status: item.isLow ? "low" : "healthy",
  };
}

export const WEEKLY_ADHERENCE = [
  { day: "Mon", status: "complete" },
  { day: "Tue", status: "complete" },
  { day: "Wed", status: "today" },
  { day: "Thu", status: "complete" },
  { day: "Fri", status: "complete" },
  { day: "Sat", status: "complete" },
  { day: "Sun", status: "partial" },
] as const;
export type IntakeSlot = "morning" | "midday" | "evening" | "bedtime";

export type DetectedMedication = {
  id: string;
  name: string;
  strength: string;
  molecule: string;
  purpose: string;
  kind: "cardio" | "glucose" | "pain";
  dose: string;
  doseNote: string;
  doseForm: "sachet" | "tablet" | "effervescent";
  stockDoses: number;
  schedule: IntakeSlot[];
  /** "HH:MM" per intake slot; only the slots in `schedule` are saved. */
  times: Record<IntakeSlot, string>;
  alertEnabled: boolean;
  alertDays: number;
  alertTarget?: string;
  matchLabel: string;
};

export type PrescriptionScan = {
  id: number;
  fileName: string;
  previewUrl: string;
  scannedAt: string;
  clarity: number | null;
  doctor: string;
  department: string;
};

/** Shown when the scan is a PDF or has no stored image. */
export const SCAN_PLACEHOLDER = "/images/prescription-scan.svg";

const SLOT_BY_TIME_OF_DAY: Record<TimeOfDay, IntakeSlot> = {
  MORNING: "morning",
  MIDDAY: "midday",
  EVENING: "evening",
  BEDTIME: "bedtime",
};

/** Same defaults as the API (api/src/common/schedule.ts). */
export const DEFAULT_SLOT_TIMES: Record<IntakeSlot, string> = {
  morning: "08:00",
  midday: "12:30",
  evening: "20:00",
  bedtime: "22:00",
};

export function toTimeOfDay(slot: IntakeSlot): TimeOfDay {
  return slot.toUpperCase() as TimeOfDay;
}

function medicationKind(purpose: string): DetectedMedication["kind"] {
  const text = purpose.toLowerCase();
  if (text.includes("glyc") || text.includes("diab")) return "glucose";
  if (text.includes("pain") || text.includes("douleur")) return "pain";
  return "cardio";
}

function medicationForm(form: string): DetectedMedication["doseForm"] {
  const text = form.toLowerCase();
  if (text.includes("sachet")) return "sachet";
  if (text.includes("effervescent")) return "effervescent";
  return "tablet";
}

/** Draft medication from the API -> the shape the review cards edit. */
export function toDetectedMedication(medication: ApiMedication): DetectedMedication {
  const unit =
    medication.doseQuantity > 1 && !medication.doseUnit.endsWith("s")
      ? `${medication.doseUnit}s`
      : medication.doseUnit;
  return {
    id: String(medication.id),
    name: medication.name,
    strength: medication.strength,
    molecule: medication.activeIngredient ?? "Active ingredient not read",
    purpose: medication.purpose ?? "Purpose to confirm",
    kind: medicationKind(medication.purpose ?? ""),
    dose: `${medication.doseQuantity} ${unit}`,
    doseNote: medication.instruction,
    doseForm: medicationForm(medication.form),
    stockDoses: medication.stockDoses,
    schedule: medication.slots.map((slot) => SLOT_BY_TIME_OF_DAY[slot.timeOfDay]),
    times: {
      ...DEFAULT_SLOT_TIMES,
      ...Object.fromEntries(
        medication.slots.map((slot) => [SLOT_BY_TIME_OF_DAY[slot.timeOfDay], slot.time]),
      ),
    },
    alertEnabled: medication.lowStockAlert,
    alertDays: medication.lowStockThresholdDays,
    alertTarget: "family care circle",
    matchLabel: medication.matchedInDatabase
      ? "Matched in official healthcare database"
      : "Read from prescription, please check",
  };
}

/** API prescription -> the scan summary card. */
export function toPrescriptionScan(
  prescription: ApiPrescription,
  fileName = `Prescription #${prescription.id}`,
): PrescriptionScan {
  const isImage = prescription.imageUrl && !prescription.imageUrl.endsWith(".pdf");
  return {
    id: prescription.id,
    fileName,
    previewUrl: isImage ? apiFileUrl(prescription.imageUrl!) : SCAN_PLACEHOLDER,
    scannedAt: new Date(prescription.createdAt).toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    clarity: prescription.ocrConfidence,
    doctor: prescription.doctorName,
    department: prescription.doctorSpecialty ?? "",
  };
}

/** Days of home supply at the current schedule, or null when no intake is scheduled. */
export function daysOfStock(medication: DetectedMedication): number | null {
  if (medication.schedule.length === 0) return null;
  return Math.floor(medication.stockDoses / medication.schedule.length);
}
