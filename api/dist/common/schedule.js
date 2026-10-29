"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SLOT_TIMES = exports.PATIENT_TIMEZONE = void 0;
exports.localDateKey = localDateKey;
exports.addDays = addDays;
exports.weekdayIndex = weekdayIndex;
exports.localDateTime = localDateTime;
exports.PATIENT_TIMEZONE = 'Europe/Paris';
exports.DEFAULT_SLOT_TIMES = {
    MORNING: '08:00',
    MIDDAY: '12:30',
    EVENING: '20:00',
    BEDTIME: '22:00',
};
function localDateKey(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: exports.PATIENT_TIMEZONE,
    }).format(date);
}
function addDays(dateKey, days) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day + days))
        .toISOString()
        .slice(0, 10);
}
function weekdayIndex(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
}
function localDateTime(dateKey, time) {
    const [year, month, day] = dateKey.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);
    const asUtc = Date.UTC(year, month - 1, day, hours, minutes);
    return new Date(asUtc - timezoneOffsetMs(new Date(asUtc)));
}
function timezoneOffsetMs(date) {
    const name = new Intl.DateTimeFormat('en-US', {
        timeZone: exports.PATIENT_TIMEZONE,
        timeZoneName: 'longOffset',
    })
        .formatToParts(date)
        .find((part) => part.type === 'timeZoneName')?.value;
    const match = name?.match(/GMT([+-])(\d{2}):(\d{2})/);
    if (!match)
        return 0;
    const sign = match[1] === '-' ? -1 : 1;
    return sign * (Number(match[2]) * 60 + Number(match[3])) * 60_000;
}
//# sourceMappingURL=schedule.js.map