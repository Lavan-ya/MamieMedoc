import { CareEventsService } from '../events/care-events.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class DosesService {
    private readonly prisma;
    private readonly events;
    constructor(prisma: PrismaService, events: CareEventsService);
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
    private findDose;
}
