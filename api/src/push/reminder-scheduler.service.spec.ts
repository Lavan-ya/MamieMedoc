import { DoseStatus } from '@prisma/client';
import { needsReminder } from './reminder-scheduler.service';

const at = (time: string) => new Date(`2026-10-29T${time}:00Z`);

function dose(overrides: Partial<Parameters<typeof needsReminder>[0]> = {}) {
  return {
    status: DoseStatus.PENDING,
    scheduledAt: at('11:30'),
    snoozedUntil: null,
    remindedAt: null,
    ...overrides,
  };
}

describe("needsReminder (push to Jeanne's tablet)", () => {
  it('waits until the dose is due', () => {
    expect(needsReminder(dose(), at('11:29'))).toBe(false);
    expect(needsReminder(dose(), at('11:30'))).toBe(true);
  });

  it('sends only once per due time', () => {
    expect(needsReminder(dose({ remindedAt: at('11:30') }), at('11:45'))).toBe(
      false,
    );
  });

  it('stays quiet while snoozed, then reminds again when the snooze ends', () => {
    const snoozed = dose({
      remindedAt: at('11:30'),
      snoozedUntil: at('11:46'),
    });
    expect(needsReminder(snoozed, at('11:40'))).toBe(false);
    expect(needsReminder(snoozed, at('11:46'))).toBe(true);
    expect(
      needsReminder({ ...snoozed, remindedAt: at('11:46') }, at('11:50')),
    ).toBe(false);
  });

  it('never reminds for a dose that is taken or missed', () => {
    expect(needsReminder(dose({ status: DoseStatus.TAKEN }), at('12:00'))).toBe(
      false,
    );
    expect(
      needsReminder(dose({ status: DoseStatus.MISSED }), at('12:00')),
    ).toBe(false);
  });
});
