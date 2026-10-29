// Medication reminder rules on Jeanne's screen.
// Due -> reminder -> "Remind me later" (up to MAX_SNOOZES times, SNOOZE_MINUTES
// each) -> one last reminder without snooze -> MISSED if still not taken
// SNOOZE_MINUTES after it. Doses never answered become MISSED at end of day.
export const MAX_SNOOZES = 3;
export const SNOOZE_MINUTES = 15;

const SNOOZE_MS = SNOOZE_MINUTES * 60_000;

export function snoozeUntil(now = new Date()) {
  return new Date(now.getTime() + SNOOZE_MS);
}

/** Last reminder (after the final snooze) still unanswered: past this, the dose is missed. */
export function lastReminderExpiredBefore(now = new Date()) {
  return new Date(now.getTime() - SNOOZE_MS);
}
