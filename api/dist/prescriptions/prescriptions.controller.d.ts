import { ConfirmPrescriptionDto } from './dto/confirm-prescription.dto';
import { ListPrescriptionsQuery, ScanPrescriptionBody } from './dto/list-prescriptions.query';
import { PrescriptionsService } from './prescriptions.service';
export declare class PrescriptionsController {
    private readonly prescriptions;
    constructor(prescriptions: PrescriptionsService);
    scan(file: Express.Multer.File | undefined, body: ScanPrescriptionBody): Promise<{
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
    list(query: ListPrescriptionsQuery): import("@prisma/client").Prisma.PrismaPromise<({
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
    discard(id: number): Promise<void>;
}
