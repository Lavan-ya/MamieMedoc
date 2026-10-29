import { type MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CareEventsService } from '../events/care-events.service';
import { CareCircleService } from './care-circle.service';
import { AdherenceQuery, CompleteRefillDto, GardenQuery, PlanRefillDto } from './dto/care-circle.dto';
export declare class CareCircleController {
    private readonly careCircle;
    private readonly events;
    constructor(careCircle: CareCircleService, events: CareEventsService);
    familyDashboard(patientId: number, query: AdherenceQuery): Promise<{
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
                doses: import("./care-circle.service").AdherenceDose[];
            }[];
            percent: number | null;
            daysOnTrack: number;
            daysTracked: number;
            streak: number;
        };
    }>;
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
    adherence(patientId: number, query: AdherenceQuery): Promise<{
        days: {
            date: string;
            scheduled: number;
            taken: number;
            status: string;
            doses: import("./care-circle.service").AdherenceDose[];
        }[];
        percent: number | null;
        daysOnTrack: number;
        daysTracked: number;
        streak: number;
    }>;
    garden(patientId: number, query: GardenQuery): Promise<{
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
    planRefill(patientId: number, dto: PlanRefillDto): Promise<{
        id: number;
        medicationId: number;
        status: import("@prisma/client").$Enums.RefillStatus;
        familyMemberId: number;
        plannedFor: string;
        createdAt: Date;
    }>;
    completeRefill(patientId: number, refillId: number, dto: CompleteRefillDto): Promise<{
        refillId: number;
        medicationId: number;
        stockDoses: number;
    }>;
    stream(patientId: number): Observable<MessageEvent>;
}
