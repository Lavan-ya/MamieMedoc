import { PrescriptionStatus } from '@prisma/client';
export declare class ListPrescriptionsQuery {
    patientId: number;
    status?: PrescriptionStatus;
}
export declare class ScanPrescriptionBody {
    patientId: number;
}
