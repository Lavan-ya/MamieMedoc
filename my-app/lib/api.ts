// Client for the NestJS API in ../api. Types mirror its JSON responses.

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// No login yet: every screen works on Jeanne's record.
export const PATIENT_ID = Number(process.env.NEXT_PUBLIC_PATIENT_ID ?? 2);

export type TimeOfDay = "MORNING" | "MIDDAY" | "EVENING" | "BEDTIME";

export type ApiScheduleSlot = {
  id: number;
  timeOfDay: TimeOfDay;
  time: string;
};

export type ApiMedication = {
  id: number;
  name: string;
  strength: string;
  activeIngredient: string | null;
  purpose: string | null;
  form: string;
  doseQuantity: number;
  doseUnit: string;
  instruction: string;
  mealInstruction: string | null;
  stockDoses: number;
  lowStockAlert: boolean;
  lowStockThresholdDays: number;
  matchedInDatabase: boolean;
  slots: ApiScheduleSlot[];
};

export type ApiPrescription = {
  id: number;
  doctorName: string;
  doctorSpecialty: string | null;
  imageUrl: string | null;
  ocrConfidence: number | null;
  status: "DRAFT" | "ACTIVE" | "EXPIRED";
  createdAt: string;
  medications: ApiMedication[];
};

export type ConfirmedMedication = {
  id: number;
  schedule: { timeOfDay: TimeOfDay; time?: string }[];
  stockDoses?: number;
  lowStockAlert?: boolean;
  lowStockThresholdDays?: number;
};

export type ApiStockItem = {
  medicationId: number;
  name: string;
  strength: string;
  stockDoses: number;
  unit: string;
  dosesPerDay: number;
  daysLeft: number | null;
  isLow: boolean;
  /** The family member who acknowledged the low stock and will refill it. */
  refill: { id: number; plannedFor: string; by: string; acknowledgedAt: string } | null;
};

export type ApiCareCircleDose = {
  id: number;
  medicationId: number;
  time: string;
  timeOfDay: TimeOfDay;
  medication: string;
  dosage: string;
  instruction: string;
  mealInstruction: string | null;
  appearance: string | null;
  /** "Si douleur": not counted for adherence or the plant. */
  asNeeded: boolean;
  status: "PENDING" | "TAKEN" | "MISSED" | "SKIPPED";
  takenAt: string | null;
  /** Family member who confirmed; null when Jeanne confirmed herself. */
  takenBy: string | null;
  /** The reminder is snoozed until this time ("Remind me in 15 minutes"). */
  snoozedUntil: string | null;
  /** Snoozes still allowed; 0 = last reminder, then the dose is marked missed. */
  snoozesLeft: number;
  stockLeft: number;
  stockUnit: string;
};

export type ApiStockAlert = {
  medicationId: number;
  medication: string; // "Metformin 500 mg"
  stockDoses: number;
  unit: string;
  refill: ApiStockItem["refill"];
};

export type ApiFamilyMember = {
  id: number;
  firstName: string;
  relation: string;
  phone: string;
  avatarUrl: string | null;
  isPrimaryCaregiver: boolean;
};

export type ApiCareCircleToday = {
  date: string;
  patient: { id: number; firstName: string; lastName: string; birthDate: string };
  members: ApiFamilyMember[];
  doses: ApiCareCircleDose[];
  /** Medicines running low (10 doses or fewer, or a week or less left). */
  stockAlerts: ApiStockAlert[];
};

/** Absolute URL for a file served by the API, e.g. "/uploads/prescriptions/x.jpg". */
export function apiFileUrl(path: string) {
  return `${API_URL}${path}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message ?? `Request failed (${response.status})`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export function listDraftPrescriptions() {
  return request<ApiPrescription[]>(`/prescriptions?patientId=${PATIENT_ID}&status=DRAFT`);
}

export function scanPrescription(file: File) {
  const form = new FormData();
  form.append("file", file);
  form.append("patientId", String(PATIENT_ID));
  return request<ApiPrescription>("/prescriptions/scan", { method: "POST", body: form });
}

export function confirmPrescription(id: number, medications: ConfirmedMedication[]) {
  // replacedMedications: same medicines Jeanne already took, now replaced by this prescription
  return request<ApiPrescription & { replacedMedications: { id: number; name: string }[] }>(
    `/prescriptions/${id}/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medications }),
    },
  );
}

export function discardPrescription(id: number) {
  return request<void>(`/prescriptions/${id}`, { method: "DELETE" });
}

/** A medication already on the schedule, with the prescription it came from. */
export type ApiCurrentMedication = ApiMedication & {
  prescription: { id: number; doctorName: string; issuedAt: string | null } | null;
};

export function listMedications() {
  return request<ApiCurrentMedication[]>(`/medications?patientId=${PATIENT_ID}`);
}

export function updateMedication(
  id: number,
  changes: Omit<ConfirmedMedication, "id" | "schedule"> & {
    schedule?: ConfirmedMedication["schedule"];
  },
) {
  return request<ApiCurrentMedication>(`/medications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });
}

/** Takes the medication off the schedule; its dose history is kept. */
export function stopMedication(id: number) {
  return request<void>(`/medications/${id}`, { method: "DELETE" });
}

export function getStock() {
  return request<ApiStockItem[]>(`/patients/${PATIENT_ID}/stock`);
}

export type ApiAdherenceDay = {
  date: string;
  scheduled: number;
  taken: number;
  status: "complete" | "partial" | "missed" | "none" | "today";
  /** That day's doses ("as needed" medicines excluded), earliest first. */
  doses: ApiAdherenceDose[];
};

export type ApiAdherenceDose = {
  id: number;
  time: string;
  medication: string;
  status: "PENDING" | "TAKEN" | "MISSED" | "SKIPPED";
  takenAt: string | null;
  /** Taken more than an hour after its time. */
  late: boolean;
};

export type ApiAdherence = {
  days: ApiAdherenceDay[];
  /** Taken / scheduled over past days; null when nothing was scheduled. */
  percent: number | null;
  daysOnTrack: number;
  daysTracked: number;
  streak: number;
};

export type ApiGardenWeek = {
  weekStart: string; // Monday
  /** Complete days that week: how tall the plant grew (0-7). */
  grownDays: number;
  trackedDays: number;
};

export type ApiGarden = {
  /** This week's plant: Monday to today. */
  week: {
    weekStart: string;
    days: Pick<ApiAdherenceDay, "date" | "status" | "scheduled" | "taken">[];
    /** Growth so far, today not included. */
    grownDays: number;
  };
  /** Past weeks' plants, oldest first. */
  garden: ApiGardenWeek[];
};

export function getGarden(weeks = 12) {
  return request<ApiGarden>(`/patients/${PATIENT_ID}/garden?weeks=${weeks}`);
}

export function getAdherence(days = 7) {
  return request<ApiAdherence>(`/patients/${PATIENT_ID}/adherence?days=${days}`);
}

/** Jeanne's "I have taken my medicine". Only her screen confirms doses. */
export function markDoseTaken(doseId: number) {
  return request<unknown>(`/doses/${doseId}/taken`, { method: "POST" });
}

/** Jeanne's "Remind me in 15 minutes" (3 times at most). */
export function snoozeDose(doseId: number) {
  return request<unknown>(`/doses/${doseId}/snooze`, { method: "POST" });
}

export type ApiFamilyDashboard = {
  today: ApiCareCircleToday;
  stock: ApiStockItem[];
  adherence: ApiAdherence;
};

export function getFamilyDashboard(days = 7) {
  return request<ApiFamilyDashboard>(`/patients/${PATIENT_ID}/family-dashboard?days=${days}`);
}

/** The refill was brought home: adds the new box to the stock. */
export function completeRefill(refillId: number, doses: number) {
  return request<unknown>(`/patients/${PATIENT_ID}/refills/${refillId}/picked-up`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doses }),
  });
}

/**
 * Calls `onChange` whenever the patient's doses, medications, prescriptions
 * or refills change on the server. Returns a function that closes the stream.
 * EventSource reconnects by itself if the API restarts.
 */
export function subscribeToPatientEvents(onChange: () => void) {
  const source = new EventSource(`${API_URL}/patients/${PATIENT_ID}/events`);
  source.onmessage = () => onChange();
  return () => source.close();
}

export function planRefill(medicationId: number, familyMemberId: number, plannedFor: string) {
  return request<unknown>(`/patients/${PATIENT_ID}/refills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ medicationId, familyMemberId, plannedFor }),
  });
}

// Push reminders on Jeanne's tablet (see public/sw.js)

export function getPushPublicKey() {
  return request<{ publicKey: string | null }>("/push/public-key");
}

export function savePushSubscription(subscription: PushSubscriptionJSON) {
  return request<{ id: number }>(`/patients/${PATIENT_ID}/push-subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint: subscription.endpoint, keys: subscription.keys }),
  });
}

export function removePushSubscription(endpoint: string) {
  return request<void>("/push-subscriptions", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
}

export function sendTestReminder() {
  return request<{ sent: number }>(`/patients/${PATIENT_ID}/push-test`, { method: "POST" });
}

export function getCareCircleToday() {
  return request<ApiCareCircleToday>(`/patients/${PATIENT_ID}/care-circle/today`);
}
