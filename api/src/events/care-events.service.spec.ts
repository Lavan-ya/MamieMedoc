import { CareEventsService } from './care-events.service';

describe('CareEventsService', () => {
  it("delivers a patient's changes only to that patient's listeners", () => {
    const events = new CareEventsService();
    const jeanne: string[] = [];
    const other: string[] = [];
    const subscriptions = [
      events.forPatient(2).subscribe((type) => jeanne.push(type)),
      events.forPatient(3).subscribe((type) => other.push(type)),
    ];

    events.emit(2, 'dose');
    events.emit(3, 'refill');
    events.emit(2, 'medication');

    expect(jeanne).toEqual(['dose', 'medication']);
    expect(other).toEqual(['refill']);
    subscriptions.forEach((subscription) => subscription.unsubscribe());
  });

  it('stops delivering after unsubscribe', () => {
    const events = new CareEventsService();
    const received: string[] = [];
    const subscription = events
      .forPatient(2)
      .subscribe((type) => received.push(type));

    subscription.unsubscribe();
    events.emit(2, 'dose');

    expect(received).toEqual([]);
  });
});
