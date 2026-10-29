import { TimeOfDay } from '@prisma/client';
export declare class ConfirmedSlotDto {
    timeOfDay: TimeOfDay;
    time?: string;
}
export declare class ConfirmedMedicationDto {
    id: number;
    schedule: ConfirmedSlotDto[];
    stockDoses?: number;
    lowStockAlert?: boolean;
    lowStockThresholdDays?: number;
}
export declare class ConfirmPrescriptionDto {
    medications: ConfirmedMedicationDto[];
}
