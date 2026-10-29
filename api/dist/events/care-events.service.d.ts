import { Observable } from 'rxjs';
export type CareEventType = 'dose' | 'medication' | 'prescription' | 'refill';
export interface CareEvent {
    patientId: number;
    type: CareEventType;
}
export declare class CareEventsService {
    private readonly events;
    emit(patientId: number, type: CareEventType): void;
    forPatient(patientId: number): Observable<CareEventType>;
}
