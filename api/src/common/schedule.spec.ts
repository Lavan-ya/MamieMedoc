import { addDays, localDateKey, localDateTime, weekdayIndex } from './schedule';

describe('schedule (Europe/Paris wall-clock times)', () => {
  it('converts a winter time (UTC+1) to UTC', () => {
    expect(localDateTime('2026-01-15', '08:00').toISOString()).toBe(
      '2026-01-15T07:00:00.000Z',
    );
  });

  it('converts a summer time (UTC+2) to UTC', () => {
    expect(localDateTime('2026-07-15', '08:00').toISOString()).toBe(
      '2026-07-15T06:00:00.000Z',
    );
  });

  it('uses summer time on the day clocks go forward', () => {
    // 29 March 2026: 02:00 -> 03:00 in Paris
    expect(localDateTime('2026-03-29', '08:00').toISOString()).toBe(
      '2026-03-29T06:00:00.000Z',
    );
  });

  it('uses winter time after clocks go back', () => {
    // 25 October 2026: 03:00 -> 02:00 in Paris
    expect(localDateTime('2026-10-26', '20:00').toISOString()).toBe(
      '2026-10-26T19:00:00.000Z',
    );
  });

  it('gives the Paris calendar day, not the UTC one', () => {
    // 23:30 UTC on the 28th is already 00:30 on the 29th in Paris
    expect(localDateKey(new Date('2026-10-28T23:30:00Z'))).toBe('2026-10-29');
    expect(localDateKey(new Date('2026-10-28T22:30:00Z'))).toBe('2026-10-28');
  });

  it('round-trips a local time through its day key', () => {
    const instant = localDateTime('2026-10-29', '00:00');
    expect(localDateKey(instant)).toBe('2026-10-29');
  });

  it('counts calendar days across the clock change and the new year', () => {
    // 25 October 2026 is 25 hours long in Paris
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25');
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-11-01', -7)).toBe('2026-10-25');
  });

  it('numbers weekdays from Monday', () => {
    expect(weekdayIndex('2026-10-26')).toBe(0); // Monday
    expect(weekdayIndex('2026-10-29')).toBe(3); // Thursday
    expect(weekdayIndex('2026-11-01')).toBe(6); // Sunday
  });
});
