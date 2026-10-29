import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DoseStatus } from '@prisma/client';
import { CareCircleService } from '../care-circle/care-circle.service';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';
interface ReminderState {
    status: DoseStatus;
    scheduledAt: Date;
    snoozedUntil: Date | null;
    remindedAt: Date | null;
}
export declare function needsReminder(dose: ReminderState, now: Date): boolean;
export declare class ReminderSchedulerService implements OnModuleInit, OnModuleDestroy {
    private readonly prisma;
    private readonly careCircle;
    private readonly push;
    private readonly logger;
    private timer?;
    private running;
    constructor(prisma: PrismaService, careCircle: CareCircleService, push: PushService);
    onModuleInit(): void;
    onModuleDestroy(): void;
    tick(now?: Date): Promise<number>;
    private remindPatient;
}
export {};
