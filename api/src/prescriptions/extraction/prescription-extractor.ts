import { TimeOfDay } from '@prisma/client';

// Injection token: swap the implementation (mock today, Claude later)
// in PrescriptionsModule without touching the service.
export const PRESCRIPTION_EXTRACTOR = Symbol('PRESCRIPTION_EXTRACTOR');

export interface UploadedScan {
  buffer: Buffer;
  mimeType: string; // "image/jpeg", "application/pdf", ...
  originalName: string;
}

export interface ExtractedMedication {
  name: string; // "Kardégic"
  strength: string; // "75 mg"
  activeIngredient?: string;
  purpose?: string;
  form: string; // "Sachet", "Tablet"
  doseQuantity: number; // 1
  doseUnit: string; // "sachet"
  instruction: string; // "dissolved in a glass of water"
  mealInstruction?: string;
  asNeeded?: boolean;
  maxPerDay?: number;
  stockDoses?: number; // doses delivered by the pharmacy, if known
  schedule: TimeOfDay[]; // proposed intake times, editable during review
}

export interface ExtractedPrescription {
  doctorName: string;
  doctorSpecialty?: string;
  clinicName?: string;
  clinicPhone?: string;
  pharmacyName?: string;
  issuedAt?: Date;
  confidence?: number; // 0-100
  medications: ExtractedMedication[];
}

export interface PrescriptionExtractor {
  extract(scan: UploadedScan): Promise<ExtractedPrescription>;
}
