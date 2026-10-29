import { DoseStatus } from '@prisma/client';
import { CareEventsService } from '../events/care-events.service';
import { PrismaService } from '../prisma/prisma.service';
export interface AdherenceDose {
    id: number;
    time: string;
    medication: string;
    status: DoseStatus;
    takenAt: Date | null;
    late: boolean;
}
export declare class CareCircleService {
    private readonly prisma;
    private readonly events;
    constructor(prisma: PrismaService, events: CareEventsService);
    familyDashboard(patientId: number, days?: number): Promise<{
        today: {
            date: string;
            patient: {
                id: number;
                firstName: string;
                lastName: string;
                birthDate: Date;
                avatarUrl: string | null;
            };
            members: {
                id: number;
                patientId: number;
                firstName: string;
                avatarUrl: string | null;
                callOrder: number;
                relation: string;
                phone: string;
                availability: string | null;
                isPrimaryCaregiver: boolean;
            }[];
            doses: {
                id: number;
                medicationId: number;
                time: string;
                timeOfDay: import("@prisma/client").$Enums.TimeOfDay;
                medication: string;
                dosage: string;
                instruction: string;
                mealInstruction: string | null;
                appearance: string | null;
                asNeeded: boolean;
                status: import("@prisma/client").$Enums.DoseStatus;
                takenAt: Date | null;
                takenBy: string | null;
                snoozedUntil: Date | null;
                snoozesLeft: number;
                stockLeft: number;
                stockUnit: string;
            }[];
            stockAlerts: {
                medicationId: number;
                medication: string;
                stockDoses: number;
                unit: string;
                refill: {
                    id: number;
                    plannedFor: string;
                    by: string;
                    acknowledgedAt: Date;
                } | null;
            }[];
        };
        stock: {
            medicationId: number;
            name: string;
            strength: string;
            stockDoses: number;
            unit: string;
            dosesPerDay: number;
            daysLeft: number | null;
            isLow: boolean;
            renewalDate: Date | null;
            refill: {
                id: number;
                plannedFor: string;
                by: string;
                acknowledgedAt: Date;
            } | null;
        }[];
        adherence: {
            days: {
                date: string;
                scheduled: number;
                taken: number;
                status: string;
                doses: AdherenceDose[];
            }[];
            percent: number | null;
            daysOnTrack: number;
            daysTracked: number;
            streak: number;
        };
    }>;
    markMissedDoses(patientId: number): Promise<number>;
    today(patientId: number): Promise<{
        date: string;
        patient: {
            id: number;
            firstName: string;
            lastName: string;
            birthDate: Date;
            avatarUrl: string | null;
        };
        members: {
            id: number;
            patientId: number;
            firstName: string;
            avatarUrl: string | null;
            callOrder: number;
            relation: string;
            phone: string;
            availability: string | null;
            isPrimaryCaregiver: boolean;
        }[];
        doses: {
            id: number;
            medicationId: number;
            time: string;
            timeOfDay: import("@prisma/client").$Enums.TimeOfDay;
            medication: string;
            dosage: string;
            instruction: string;
            mealInstruction: string | null;
            appearance: string | null;
            asNeeded: boolean;
            status: import("@prisma/client").$Enums.DoseStatus;
            takenAt: Date | null;
            takenBy: string | null;
            snoozedUntil: Date | null;
            snoozesLeft: number;
            stockLeft: number;
            stockUnit: string;
        }[];
        stockAlerts: {
            medicationId: number;
            medication: string;
            stockDoses: number;
            unit: string;
            refill: {
                id: number;
                plannedFor: string;
                by: string;
                acknowledgedAt: Date;
            } | null;
        }[];
    }>;
    stock(patientId: number): Promise<{
        medicationId: number;
        name: string;
        strength: string;
        stockDoses: number;
        unit: string;
        dosesPerDay: number;
        daysLeft: number | null;
        isLow: boolean;
        renewalDate: Date | null;
        refill: {
            id: number;
            plannedFor: string;
            by: string;
            acknowledgedAt: Date;
        } | null;
    }[]>;
    adherence(patientId: number, days: number): Promise<{
        days: {
            date: string;
            scheduled: number;
            taken: number;
            status: string;
            doses: AdherenceDose[];
        }[];
        percent: number | null;
        daysOnTrack: number;
        daysTracked: number;
        streak: number;
    }>;
    garden(patientId: number, weeks: number): Promise<{
        week: {
            weekStart: string;
            days: {
                date: string;
                status: string;
                scheduled: number;
                taken: number;
            }[];
            grownDays: number;
        };
        garden: {
            weekStart: string;
            grownDays: number;
            trackedDays: number;
        }[];
    }>;
    planRefill(patientId: number, medicationId: number, familyMemberId: number, plannedFor: string): Promise<{
        id: number;
        medicationId: number;
        status: import("@prisma/client").$Enums.RefillStatus;
        familyMemberId: number;
        plannedFor: string;
        createdAt: Date;
    }>;
    completeRefill(patientId: number, refillId: number, doses: number): Promise<{
        refillId: number;
        medicationId: number;
        stockDoses: number;
    }>;
    private activeMedications;
}
