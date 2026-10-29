import { DosesService } from './doses.service';
export declare class DosesController {
    private readonly doses;
    constructor(doses: DosesService);
    markTaken(id: number): Promise<{
        id: number;
        slotId: number;
        scheduledAt: Date;
        status: import("@prisma/client").$Enums.DoseStatus;
        takenAt: Date | null;
        snoozedUntil: Date | null;
        snoozeCount: number;
        remindedAt: Date | null;
        confirmedById: number | null;
    }>;
    snooze(id: number): Promise<{
        id: number;
        slotId: number;
        scheduledAt: Date;
        status: import("@prisma/client").$Enums.DoseStatus;
        takenAt: Date | null;
        snoozedUntil: Date | null;
        snoozeCount: number;
        remindedAt: Date | null;
        confirmedById: number | null;
    }>;
}
