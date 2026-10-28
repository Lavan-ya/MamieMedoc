export type DoseStatus = "taken" | "pending" | "scheduled";

export type Dose = {
  id: string;
  time: string;
  period: string;
  name: string;
  dosage: string;
  instructions: string;
  status: DoseStatus;
  takenAt?: string;
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

export const WEEKLY_ADHERENCE = [
  { day: "Mon", status: "complete" },
  { day: "Tue", status: "complete" },
  { day: "Wed", status: "today" },
  { day: "Thu", status: "complete" },
  { day: "Fri", status: "complete" },
  { day: "Sat", status: "complete" },
  { day: "Sun", status: "partial" },
] as const;