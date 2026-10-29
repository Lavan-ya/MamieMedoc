"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNOOZE_MINUTES = exports.MAX_SNOOZES = void 0;
exports.snoozeUntil = snoozeUntil;
exports.lastReminderExpiredBefore = lastReminderExpiredBefore;
exports.MAX_SNOOZES = 3;
exports.SNOOZE_MINUTES = 15;
const SNOOZE_MS = exports.SNOOZE_MINUTES * 60_000;
function snoozeUntil(now = new Date()) {
    return new Date(now.getTime() + SNOOZE_MS);
}
function lastReminderExpiredBefore(now = new Date()) {
    return new Date(now.getTime() - SNOOZE_MS);
}
//# sourceMappingURL=reminders.js.map