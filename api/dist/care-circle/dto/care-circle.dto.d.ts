export declare class AdherenceQuery {
    days?: number;
}
export declare class GardenQuery {
    weeks?: number;
}
export declare class PlanRefillDto {
    medicationId: number;
    familyMemberId: number;
    plannedFor: string;
}
export declare class CompleteRefillDto {
    doses: number;
}
