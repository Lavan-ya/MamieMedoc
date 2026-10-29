import { CareEventsService } from '../events/care-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMedicationDto } from './dto/update-medication.dto';
export declare class MedicationsService {
    private readonly prisma;
    private readonly events;
    constructor(prisma: PrismaService, events: CareEventsService);
    list(patientId: number): import("@prisma/client").Prisma.PrismaPromise<({
        prescription: {
            id: number;
            doctorName: string;
            issuedAt: Date | null;
        } | null;
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
    })[]>;
    update(id: number, dto: UpdateMedicationDto): Promise<{
        prescription: {
            id: number;
            doctorName: string;
            issuedAt: Date | null;
        } | null;
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
    }>;
    stop(id: number): Promise<void>;
    private findActive;
}
