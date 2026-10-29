import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
export interface ReminderPayload {
    doseId: number;
    title: string;
    body: string;
    snoozesLeft: number;
}
export declare class PushService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    private publicKey;
    constructor(prisma: PrismaService);
    onModuleInit(): void;
    get enabled(): boolean;
    getPublicKey(): string | null;
    subscribe(patientId: number, subscription: PushSubscriptionDto): import("@prisma/client").Prisma.Prisma__PushSubscriptionClient<{
        id: number;
        patientId: number;
        createdAt: Date;
        p256dh: string;
        auth: string;
        endpoint: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    unsubscribe(endpoint: string): Promise<void>;
    sendToPatient(patientId: number, payload: ReminderPayload): Promise<number>;
}
