import { ConfirmedSlotDto } from '../../prescriptions/dto/confirm-prescription.dto';
export declare class ListMedicationsQuery {
    patientId: number;
}
export declare class UpdateMedicationDto {
    schedule?: ConfirmedSlotDto[];
    stockDoses?: number;
    lowStockAlert?: boolean;
}
