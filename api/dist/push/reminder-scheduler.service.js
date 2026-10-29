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
var ReminderSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderSchedulerService = void 0;
exports.needsReminder = needsReminder;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const reminders_1 = require("../common/reminders");
const schedule_1 = require("../common/schedule");
const care_circle_service_1 = require("../care-circle/care-circle.service");
const prisma_service_1 = require("../prisma/prisma.service");
const push_service_1 = require("./push.service");
function needsReminder(dose, now) {
    if (dose.status !== client_1.DoseStatus.PENDING)
        return false;
    const dueAt = dose.snoozedUntil ?? dose.scheduledAt;
    if (dueAt > now)
        return false;
    return dose.remindedAt === null || dose.remindedAt < dueAt;
}
let ReminderSchedulerService = ReminderSchedulerService_1 = class ReminderSchedulerService {
    prisma;
    careCircle;
    push;
    logger = new common_1.Logger(ReminderSchedulerService_1.name);
    timer;
    running = false;
    constructor(prisma, careCircle, push) {
        this.prisma = prisma;
        this.careCircle = careCircle;
        this.push = push;
    }
    onModuleInit() {
        if (process.env.PUSH_REMINDERS === 'off' || !this.push.enabled)
            return;
        const tickMs = Number(process.env.REMINDER_INTERVAL_MS ?? 60_000);
        this.timer = setInterval(() => void this.tick(), tickMs);
        this.logger.log(`Push reminders on (every ${tickMs / 1000}s)`);
    }
    onModuleDestroy() {
        clearInterval(this.timer);
    }
    async tick(now = new Date()) {
        if (this.running)
            return 0;
        this.running = true;
        let sent = 0;
        try {
            const patients = await this.prisma.pushSubscription.findMany({
                distinct: ['patientId'],
                select: { patientId: true },
            });
            for (const { patientId } of patients) {
                sent += await this.remindPatient(patientId, now);
            }
        }
        catch (error) {
            this.logger.error(`Reminder pass failed: ${error.message}`);
        }
        finally {
            this.running = false;
        }
        return sent;
    }
    async remindPatient(patientId, now) {
        await this.careCircle.today(patientId);
        const doses = await this.prisma.doseEvent.findMany({
            where: {
                status: client_1.DoseStatus.PENDING,
                scheduledAt: {
                    gte: (0, schedule_1.localDateTime)((0, schedule_1.localDateKey)(now), '00:00'),
                    lte: now,
                },
                slot: { isActive: true, medication: { patientId, isActive: true } },
            },
            include: { slot: { include: { medication: true } } },
            orderBy: { scheduledAt: 'asc' },
        });
        let sent = 0;
        for (const dose of doses.filter((candidate) => needsReminder(candidate, now))) {
            const medication = dose.slot.medication;
            const snoozesLeft = Math.max(0, reminders_1.MAX_SNOOZES - dose.snoozeCount);
            const quantity = `${medication.doseQuantity} ${medication.doseUnit}${medication.doseQuantity > 1 && !medication.doseUnit.endsWith('s') ? 's' : ''}`;
            await this.prisma.doseEvent.update({
                where: { id: dose.id },
                data: { remindedAt: now },
            });
            sent += await this.push.sendToPatient(patientId, {
                doseId: dose.id,
                title: snoozesLeft === 0
                    ? 'Last reminder: your medicine'
                    : 'Time for your medicine',
                body: `${medication.name} ${medication.strength} · ${quantity}, ${medication.instruction}`,
                snoozesLeft,
            });
        }
        return sent;
    }
};
exports.ReminderSchedulerService = ReminderSchedulerService;
exports.ReminderSchedulerService = ReminderSchedulerService = ReminderSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        care_circle_service_1.CareCircleService,
        push_service_1.PushService])
], ReminderSchedulerService);
//# sourceMappingURL=reminder-scheduler.service.js.map