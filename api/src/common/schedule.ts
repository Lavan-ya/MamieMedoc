import { TimeOfDay } from '@prisma/client';

// All schedule times are wall-clock times in the patient's timezone.
export const PATIENT_TIMEZONE = 'Europe/Paris';

export const DEFAULT_SLOT_TIMES: Record<TimeOfDay, string> = {
  MORNING: '08:00',
  MIDDAY: '12:30',
  EVENING: '20:00',
  BEDTIME: '22:00',
};

/** "2026-10-29" for the given instant, in the patient's timezone. */
export function localDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PATIENT_TIMEZONE,
  }).format(date);
}

/** Calendar arithmetic on day keys: addDays("2026-10-31", 1) = "2026-11-01". */
export function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

/** 0 = Monday ... 6 = Sunday. */
export function weekdayIndex(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}

/** UTC instant for a wall-clock "HH:MM" on a "YYYY-MM-DD" day in the patient's timezone. */
export function localDateTime(dateKey: string, time: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const asUtc = Date.UTC(year, month - 1, day, hours, minutes);
  return new Date(asUtc - timezoneOffsetMs(new Date(asUtc)));
}

/** Offset of the patient's timezone from UTC at the given instant (+1h in winter, +2h in summer for Paris). */
function timezoneOffsetMs(date: Date): number {
  const name = new Intl.DateTimeFormat('en-US', {
    timeZone: PATIENT_TIMEZONE,
    timeZoneName: 'longOffset',
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value; // "GMT+01:00"
  const match = name?.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3])) * 60_000;
}
