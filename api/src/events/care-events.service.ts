import { Injectable } from '@nestjs/common';
import { filter, map, Observable, Subject } from 'rxjs';

export type CareEventType = 'dose' | 'medication' | 'prescription' | 'refill';

export interface CareEvent {
  patientId: number;
  type: CareEventType;
}

/**
 * In-process bus telling open screens (family dashboard, Mamie view) that a
 * patient's data changed, so they re-fetch instead of polling. Clients only
 * get "what changed", never data. Single-instance only: running several API
 * instances would need Redis or Postgres LISTEN/NOTIFY instead.
 */
@Injectable()
export class CareEventsService {
  private readonly events = new Subject<CareEvent>();

  emit(patientId: number, type: CareEventType) {
    this.events.next({ patientId, type });
  }

  forPatient(patientId: number): Observable<CareEventType> {
    return this.events.pipe(
      filter((event) => event.patientId === patientId),
      map((event) => event.type),
    );
  }
}
