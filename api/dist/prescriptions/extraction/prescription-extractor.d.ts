import { TimeOfDay } from '@prisma/client';
export declare const PRESCRIPTION_EXTRACTOR: unique symbol;
export interface UploadedScan {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
}
export interface ExtractedMedication {
    name: string;
    strength: string;
    activeIngredient?: string;
    purpose?: string;
    form: string;
    doseQuantity: number;
    doseUnit: string;
    instruction: string;
    mealInstruction?: string;
    asNeeded?: boolean;
    maxPerDay?: number;
    stockDoses?: number;
    schedule: TimeOfDay[];
}
export interface ExtractedPrescription {
    doctorName: string;
    doctorSpecialty?: string;
    clinicName?: string;
    clinicPhone?: string;
    pharmacyName?: string;
    issuedAt?: Date;
    confidence?: number;
    medications: ExtractedMedication[];
}
export interface PrescriptionExtractor {
    extract(scan: UploadedScan): Promise<ExtractedPrescription>;
}
