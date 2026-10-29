import { PrescriptionStatus } from '@prisma/client';
import { CareEventsService } from '../events/care-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfirmPrescriptionDto } from './dto/confirm-prescription.dto';
import { type PrescriptionExtractor, type UploadedScan } from './extraction/prescription-extractor';
export declare const UPLOADS_DIR: string;
export declare class PrescriptionsService {
    private readonly prisma;
    private readonly events;
    private readonly extractor;
    constructor(prisma: PrismaService, events: CareEventsService, extractor: PrescriptionExtractor);
    scan(patientId: number, scan: UploadedScan): Promise<{
        medications: ({
            slots: {
                id: number;
                isActive: boolean;
                medicationId: number;
                timeOfDay: import("@prisma/client").$Enums.TimeOfDay;
                time: string;
            }[];
        } & {
            name: string;
            id: number;
            patientId: number;
            prescriptionId: number | null;
            strength: string;
            activeIngredient: string | null;
            purpose: string | null;
            form: string;
            doseQuantity: number;
            doseUnit: string;
            instruction: string;
            mealInstruction: string | null;
            appearance: string | null;
            pillboxSection: string | null;
            asNeeded: boolean;
            maxPerDay: number | null;
            stockDoses: number;
            lowStockAlert: boolean;
            lowStockThresholdDays: number;
            renewalDate: Date | null;
            matchedInDatabase: boolean;
            isActive: boolean;
        })[];
    } & {
        id: number;
        patientId: number;
        status: import("@prisma/client").$Enums.PrescriptionStatus;
        createdAt: Date;
        doctorName: string;
        doctorSpecialty: string | null;
        clinicName: string | null;
        clinicPhone: string | null;
        pharmacyName: string | null;
        issuedAt: Date | null;
        imageUrl: string | null;
        ocrConfidence: number | null;
    }>;
    list(patientId: number, status?: PrescriptionStatus): import("@prisma/client").Prisma.PrismaPromise<({
        medications: ({
            slots: {
                id: number;
                isActive: boolean;
                medicationId: number;
                timeOfDay: import("@prisma/client").$Enums.TimeOfDay;
                time: string;
            }[];
        } & {
            name: string;
            id: number;
            patientId: number;
            prescriptionId: number | null;
            strength: string;
            activeIngredient: string | null;
            purpose: string | null;
            form: string;
            doseQuantity: number;
            doseUnit: string;
            instruction: string;
            mealInstruction: string | null;
            appearance: string | null;
            pillboxSection: string | null;
            asNeeded: boolean;
            maxPerDay: number | null;
            stockDoses: number;
            lowStockAlert: boolean;
            lowStockThresholdDays: number;
            renewalDate: Date | null;
            matchedInDatabase: boolean;
            isActive: boolean;
        })[];
    } & {
        id: number;
        patientId: number;
        status: import("@prisma/client").$Enums.PrescriptionStatus;
        createdAt: Date;
        doctorName: string;
        doctorSpecialty: string | null;
        clinicName: string | null;
        clinicPhone: string | null;
        pharmacyName: string | null;
        issuedAt: Date | null;
        imageUrl: string | null;
        ocrConfidence: number | null;
    })[]>;
    findOne(id: number): Promise<{
        medications: ({
            slots: {
                id: number;
                isActive: boolean;
                medicationId: number;
                timeOfDay: import("@prisma/client").$Enums.TimeOfDay;
                time: string;
            }[];
        } & {
            name: string;
            id: number;
            patientId: number;
            prescriptionId: number | null;
            strength: string;
            activeIngredient: string | null;
            purpose: string | null;
            form: string;
            doseQuantity: number;
            doseUnit: string;
            instruction: string;
            mealInstruction: string | null;
            appearance: string | null;
            pillboxSection: string | null;
            asNeeded: boolean;
            maxPerDay: number | null;
            stockDoses: number;
            lowStockAlert: boolean;
            lowStockThresholdDays: number;
            renewalDate: Date | null;
            matchedInDatabase: boolean;
            isActive: boolean;
        })[];
    } & {
        id: number;
        patientId: number;
        status: import("@prisma/client").$Enums.PrescriptionStatus;
        createdAt: Date;
        doctorName: string;
        doctorSpecialty: string | null;
        clinicName: string | null;
        clinicPhone: string | null;
        pharmacyName: string | null;
        issuedAt: Date | null;
        imageUrl: string | null;
        ocrConfidence: number | null;
    }>;
    confirm(id: number, dto: ConfirmPrescriptionDto): Promise<{
        replacedMedications: {
            id: number;
            name: string;
        }[];
        medications: ({
            slots: {
                id: number;
                isActive: boolean;
                medicationId: number;
                timeOfDay: import("@prisma/client").$Enums.TimeOfDay;
                time: string;
            }[];
        } & {
            name: string;
            id: number;
            patientId: number;
            prescriptionId: number | null;
            strength: string;
            activeIngredient: string | null;
            purpose: string | null;
            form: string;
            doseQuantity: number;
            doseUnit: string;
            instruction: string;
            mealInstruction: string | null;
            appearance: string | null;
            pillboxSection: string | null;
            asNeeded: boolean;
            maxPerDay: number | null;
            stockDoses: number;
            lowStockAlert: boolean;
            lowStockThresholdDays: number;
            renewalDate: Date | null;
            matchedInDatabase: boolean;
            isActive: boolean;
        })[];
        id: number;
        patientId: number;
        status: import("@prisma/client").$Enums.PrescriptionStatus;
        createdAt: Date;
        doctorName: string;
        doctorSpecialty: string | null;
        clinicName: string | null;
        clinicPhone: string | null;
        pharmacyName: string | null;
        issuedAt: Date | null;
        imageUrl: string | null;
        ocrConfidence: number | null;
    }>;
    private replaceMedication;
    discard(id: number): Promise<void>;
    private findDraft;
    private assertPatientExists;
}
