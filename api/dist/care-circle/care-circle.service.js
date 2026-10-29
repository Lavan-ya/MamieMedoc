"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareCircleService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const reminders_1 = require("../common/reminders");
const schedule_1 = require("../common/schedule");
const stock_1 = require("../common/stock");
const care_events_service_1 = require("../events/care-events.service");
const prisma_service_1 = require("../prisma/prisma.service");
const LATE_MS = 60 * 60_000;
function plural(unit, count) {
    return count > 1 && !unit.endsWith('s') ? `${unit}s` : unit;
}
let CareCircleService = class CareCircleService {
    prisma;
    events;
    constructor(prisma, events) {
        this.prisma = prisma;
        this.events = events;
    }
    async familyDashboard(patientId, days = 7) {
        const today = await this.today(patientId);
        const [stock, adherence] = await Promise.all([
            this.stock(patientId),
            this.adherence(patientId, days),
        ]);
        return { today, stock, adherence };
    }
    async markMissedDoses(patientId) {
        const { count } = await this.prisma.doseEvent.updateMany({
            where: {
                status: client_1.DoseStatus.PENDING,
                slot: { medication: { patientId } },
                OR: [
                    { scheduledAt: { lt: (0, schedule_1.localDateTime)((0, schedule_1.localDateKey)(), '00:00') } },
                    {
                        snoozeCount: { gte: reminders_1.MAX_SNOOZES },
                        snoozedUntil: { lt: (0, reminders_1.lastReminderExpiredBefore)() },
                    },
                ],
            },
            data: { status: client_1.DoseStatus.MISSED },
        });
        if (count > 0)
            this.events.emit(patientId, 'dose');
        return count;
    }
    async today(patientId) {
        const patient = await this.prisma.patient.findUnique({
            where: { id: patientId },
            include: { familyMembers: { orderBy: { callOrder: 'asc' } } },
        });
        if (!patient)
            throw new common_1.NotFoundException(`Patient ${patientId} not found`);
        await this.markMissedDoses(patientId);
        const medications = await this.activeMedications(patientId);
        const slots = medications.flatMap((medication) => medication.slots.map((slot) => ({ slot, medication })));
        const dateKey = (0, schedule_1.localDateKey)();
        const today = {
            slotId: { in: slots.map(({ slot }) => slot.id) },
            scheduledAt: {
                gte: (0, schedule_1.localDateTime)(dateKey, '00:00'),
                lte: (0, schedule_1.localDateTime)(dateKey, '23:59'),
            },
        };
        const withConfirmer = {
            confirmedBy: { select: { firstName: true } },
        };
        const existing = await this.prisma.doseEvent.findMany({
            where: today,
            include: withConfirmer,
        });
        const covered = new Set(existing.map((event) => event.slotId));
        const missing = slots.filter(({ slot }) => !covered.has(slot.id));
        if (missing.length > 0) {
            await this.prisma.doseEvent.createMany({
                data: missing.map(({ slot }) => ({
                    slotId: slot.id,
                    scheduledAt: (0, schedule_1.localDateTime)(dateKey, slot.time),
                })),
                skipDuplicates: true,
            });
        }
        const events = missing.length > 0
            ? await this.prisma.doseEvent.findMany({
                where: today,
                include: withConfirmer,
            })
            : existing;
        const eventBySlot = new Map(events.map((event) => [event.slotId, event]));
        const doses = slots
            .map(({ slot, medication }) => {
            const event = eventBySlot.get(slot.id);
            return {
                id: event.id,
                medicationId: medication.id,
                time: slot.time,
                timeOfDay: slot.timeOfDay,
                medication: `${medication.name} ${medication.strength}`.trim(),
                dosage: `${medication.doseQuantity} ${plural(medication.doseUnit, medication.doseQuantity)}`,
                instruction: medication.instruction,
                mealInstruction: medication.mealInstruction,
                appearance: medication.appearance,
                asNeeded: medication.asNeeded,
                status: event.status,
                takenAt: event.takenAt,
                takenBy: event.confirmedBy?.firstName ?? null,
                snoozedUntil: event.snoozedUntil,
                snoozesLeft: Math.max(0, reminders_1.MAX_SNOOZES - event.snoozeCount),
                stockLeft: medication.stockDoses,
                stockUnit: plural(medication.doseUnit, medication.stockDoses),
            };
        })
            .sort((a, b) => a.time.localeCompare(b.time));
        const stockAlerts = (await this.stock(patientId))
            .filter((item) => item.isLow)
            .map(({ medicationId, name, strength, stockDoses, unit, refill }) => ({
            medicationId,
            medication: `${name} ${strength}`,
            stockDoses,
            unit,
            refill,
        }));
        return {
            date: dateKey,
            patient: {
                id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                birthDate: patient.birthDate,
                avatarUrl: patient.avatarUrl,
            },
            members: patient.familyMembers,
            doses,
            stockAlerts,
        };
    }
    async stock(patientId) {
        const medications = await this.activeMedications(patientId);
        const refills = await this.prisma.refillRequest.findMany({
            where: {
                status: client_1.RefillStatus.PLANNED,
                medicationId: { in: medications.map((medication) => medication.id) },
            },
            include: { familyMember: { select: { firstName: true } } },
            orderBy: { createdAt: 'asc' },
        });
        const refillByMedication = new Map(refills.map((refill) => [refill.medicationId, refill]));
        return medications.map((medication) => {
            const refill = refillByMedication.get(medication.id);
            const dosesPerDay = medication.slots.length;
            const daysLeft = dosesPerDay > 0
                ? Math.floor(medication.stockDoses / dosesPerDay)
                : null;
            return {
                medicationId: medication.id,
                name: medication.name,
                strength: medication.strength,
                stockDoses: medication.stockDoses,
                unit: plural(medication.doseUnit, medication.stockDoses),
                dosesPerDay,
                daysLeft,
                isLow: (0, stock_1.isLowStock)({ ...medication, daysLeft }),
                renewalDate: medication.renewalDate,
                refill: refill
                    ? {
                        id: refill.id,
                        plannedFor: refill.plannedFor,
                        by: refill.familyMember.firstName,
                        acknowledgedAt: refill.createdAt,
                    }
                    : null,
            };
        });
    }
    async adherence(patientId, days) {
        const today = (0, schedule_1.localDateKey)();
        const dayKeys = Array.from({ length: days }, (_, index) => (0, schedule_1.addDays)(today, index - (days - 1)));
        const todayKey = dayKeys[dayKeys.length - 1];
        await this.markMissedDoses(patientId);
        const events = await this.prisma.doseEvent.findMany({
            where: {
                scheduledAt: {
                    gte: (0, schedule_1.localDateTime)(dayKeys[0], '00:00'),
                    lte: (0, schedule_1.localDateTime)(todayKey, '23:59'),
                },
                slot: { medication: { patientId, asNeeded: false } },
            },
            select: {
                id: true,
                scheduledAt: true,
                status: true,
                takenAt: true,
                slot: {
                    select: {
                        time: true,
                        medication: { select: { name: true, strength: true } },
                    },
                },
            },
            orderBy: { scheduledAt: 'asc' },
        });
        const byDay = new Map(dayKeys.map((key) => [
            key,
            { scheduled: 0, taken: 0, doses: [] },
        ]));
        for (const event of events) {
            const day = byDay.get((0, schedule_1.localDateKey)(event.scheduledAt));
            if (!day)
                continue;
            day.scheduled += 1;
            if (event.status === client_1.DoseStatus.TAKEN)
                day.taken += 1;
            day.doses.push({
                id: event.id,
                time: event.slot.time,
                medication: `${event.slot.medication.name} ${event.slot.medication.strength}`.trim(),
                status: event.status,
                takenAt: event.takenAt,
                late: event.takenAt !== null &&
                    event.takenAt.getTime() - event.scheduledAt.getTime() > LATE_MS,
            });
        }
        const result = dayKeys.map((date) => {
            const { scheduled, taken, doses } = byDay.get(date);
            const status = date === todayKey
                ? 'today'
                : scheduled === 0
                    ? 'none'
                    : taken === scheduled
                        ? 'complete'
                        : taken > 0
                            ? 'partial'
                            : 'missed';
            return { date, scheduled, taken, status, doses };
        });
        const past = result.filter((day) => day.status !== 'today' && day.scheduled > 0);
        const scheduled = past.reduce((sum, day) => sum + day.scheduled, 0);
        const taken = past.reduce((sum, day) => sum + day.taken, 0);
        let streak = 0;
        for (const day of [...past].reverse()) {
            if (day.status !== 'complete')
                break;
            streak += 1;
        }
        return {
            days: result,
            percent: scheduled > 0 ? Math.round((taken / scheduled) * 100) : null,
            daysOnTrack: past.filter((day) => day.status === 'complete').length,
            daysTracked: past.length,
            streak,
        };
    }
    async garden(patientId, weeks) {
        const todayKey = (0, schedule_1.localDateKey)();
        const monday = (0, schedule_1.addDays)(todayKey, -(0, schedule_1.weekdayIndex)(todayKey));
        const firstMonday = (0, schedule_1.addDays)(monday, -7 * (weeks - 1));
        const { days } = await this.adherence(patientId, (weeks - 1) * 7 + (0, schedule_1.weekdayIndex)(todayKey) + 1);
        const summary = (day) => ({
            date: day.date,
            status: day.status,
            scheduled: day.scheduled,
            taken: day.taken,
        });
        const pastWeeks = Array.from({ length: weeks - 1 }, (_, index) => {
            const start = (0, schedule_1.addDays)(firstMonday, index * 7);
            const week = days.filter((day) => day.date >= start && day.date <= (0, schedule_1.addDays)(start, 6));
            return {
                weekStart: start,
                grownDays: week.filter((day) => day.status === 'complete').length,
                trackedDays: week.filter((day) => day.scheduled > 0).length,
            };
        });
        const thisWeek = days.filter((day) => day.date >= monday);
        return {
            week: {
                weekStart: monday,
                days: thisWeek.map(summary),
                grownDays: thisWeek.filter((day) => day.status === 'complete').length,
            },
            garden: pastWeeks.filter((week) => week.trackedDays > 0),
        };
    }
    async planRefill(patientId, medicationId, familyMemberId, plannedFor) {
        const [medication, member] = await Promise.all([
            this.prisma.medication.findFirst({
                where: { id: medicationId, patientId, isActive: true },
            }),
            this.prisma.familyMember.findFirst({
                where: { id: familyMemberId, patientId },
            }),
        ]);
        if (!medication) {
            throw new common_1.NotFoundException(`Medication ${medicationId} not found`);
        }
        if (!member) {
            throw new common_1.NotFoundException(`Family member ${familyMemberId} not found`);
        }
        const [, refill] = await this.prisma.$transaction([
            this.prisma.refillRequest.deleteMany({
                where: { medicationId, status: client_1.RefillStatus.PLANNED },
            }),
            this.prisma.refillRequest.create({
                data: { medicationId, familyMemberId, plannedFor },
            }),
        ]);
        this.events.emit(patientId, 'refill');
        return refill;
    }
    async completeRefill(patientId, refillId, doses) {
        const refill = await this.prisma.refillRequest.findFirst({
            where: { id: refillId, medication: { patientId } },
        });
        if (!refill)
            throw new common_1.NotFoundException(`Refill ${refillId} not found`);
        if (refill.status === client_1.RefillStatus.DONE) {
            throw new common_1.ConflictException(`Refill ${refillId} was already picked up`);
        }
        const [, medication] = await this.prisma.$transaction([
            this.prisma.refillRequest.update({
                where: { id: refillId },
                data: { status: client_1.RefillStatus.DONE },
            }),
            this.prisma.medication.update({
                where: { id: refill.medicationId },
                data: { stockDoses: { increment: doses } },
            }),
        ]);
        this.events.emit(patientId, 'refill');
        return {
            refillId,
            medicationId: medication.id,
            stockDoses: medication.stockDoses,
        };
    }
    activeMedications(patientId) {
        return this.prisma.medication.findMany({
            where: {
                patientId,
                isActive: true,
                OR: [
                    { prescriptionId: null },
                    { prescription: { status: client_1.PrescriptionStatus.ACTIVE } },
                ],
            },
            include: { slots: { where: { isActive: true } } },
            orderBy: { id: 'asc' },
        });
    }
};
exports.CareCircleService = CareCircleService;
exports.CareCircleService = CareCircleService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        care_events_service_1.CareEventsService])
], CareCircleService);
//# sourceMappingURL=care-circle.service.js.map