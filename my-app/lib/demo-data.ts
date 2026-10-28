import type { ProfileId } from "./profile";

export type DosePeriod = "Morning" | "Lunch" | "Evening";

export interface FamilyMember {
  id: ProfileId;
  name: string;
  role: string;
  city?: string;
  phone: string;
  profile: ProfileId;
  image: string;
}

export interface Dose {
  id: string;
  time: string;
  period: DosePeriod;
  medication: string;
  dosage: string;
  instructions?: string;
  timing: string;
  appearance?: string;
  stockLeft: number;
  stockUnit: string;
}

export interface Mamie {
  name: string;
  age: number;
  profile: ProfileId;
  image: string;
}

export interface Plant {
  name: string;
  happyDays: number;
}

export interface Refill {
  broughtBy: string;
  when: string;
  message: string;
}

export interface Weather {
  label: string;
  temperature: string;
  condition: string;
  city: string;
}

export interface DemoData {
  family: { name: string };
  mamie: Mamie;
  plant: Plant;
  members: FamilyMember[];
  todaysDoses: Dose[];
  refill: Refill;
  weather: Weather;
}

export const demoData = {
  family: {
    name: "Dupont Family",
  },
  mamie: {
    name: "Jeanne Dupont",
    age: 82,
    profile: "jeanne",
    image: "/images/jeanne.jpg",
  },
  plant: {
    name: "Léon the Fern",
    happyDays: 14,
  },
  members: [
    {
      id: "lavanya",
      name: "Lavanya",
      role: "Daughter",
      city: "Paris",
      phone: "+33 6 00 00 00 01",
      profile: "lavanya",
      image: "/images/lavanya.jpg",
    },
    {
      id: "amar",
      name: "Amar",
      role: "Son",
      city: "Lyon",
      phone: "+33 6 00 00 00 02",
      profile: "amar",
      image: "/images/amar.jpg",
    },
    {
      id: "sophie",
      name: "Sophie",
      role: "Home nurse",
      phone: "+33 6 00 00 00 03",
      profile: "sophie",
      image: "/images/sophie.jpg",
    },
  ],
  todaysDoses: [
    {
      id: "morning",
      time: "08:00",
      period: "Morning",
      medication: "Kardégic 75 mg",
      dosage: "1 sachet",
      instructions: "dissolved in a glass of water",
      timing: "after breakfast",
      appearance: "white paper sachet",
      stockLeft: 20,
      stockUnit: "sachets",
    },
    {
      id: "lunch",
      time: "12:30",
      period: "Lunch",
      medication: "Tahor 20 mg",
      dosage: "1 tablet",
      instructions: "with water",
      timing: "during lunch",
      stockLeft: 4,
      stockUnit: "tablets",
    },
    {
      id: "evening",
      time: "20:00",
      period: "Evening",
      medication: "Calcidiol",
      dosage: "3 drops",
      timing: "before sleep",
      stockLeft: 1,
      stockUnit: "bottle",
    },
  ],
  refill: {
    broughtBy: "Lavanya",
    when: "Thursday afternoon",
    message: "Lavanya is bringing the medicine on Thursday afternoon.",
  },
  weather: {
    label: "19°C · Sunny",
    temperature: "19°C",
    condition: "Sunny",
    city: "Paris",
  },
} satisfies DemoData;
