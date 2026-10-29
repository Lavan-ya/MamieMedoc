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
exports.MedicationsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const schedule_1 = require("../common/schedule");
const care_events_service_1 = require("../events/care-events.service");
const prisma_service_1 = require("../prisma/prisma.service");
const withSchedule = {
    slots: { where: { isActive: true }, orderBy: { time: 'asc' } },
    prescription: { select: { id: true, doctorName: true, issuedAt: true } },
};
let MedicationsService = class MedicationsService {
    prisma;
    events;
    constructor(prisma, events) {
        this.prisma = prisma;
        this.events = events;
    }
    list(patientId) {
        return this.prisma.medication.findMany({
            where: {
                patientId,
                isActive: true,
                OR: [
                    { prescriptionId: null },
                    { prescription: { status: client_1.PrescriptionStatus.ACTIVE } },
                ],
            },
            include: withSchedule,
            orderBy: { id: 'asc' },
        });
    }
    async update(id, dto) {
        const medication = await this.findActive(id);
        const dateKey = (0, schedule_1.localDateKey)();
        const todayStart = (0, schedule_1.localDateTime)(dateKey, '00:00');
        await this.prisma.$transaction(async (tx) => {
            await tx.medication.update({
                where: { id },
                data: {
                    stockDoses: dto.stockDoses,
                    lowStockAlert: dto.lowStockAlert,
                },
            });
            if (!dto.schedule)
                return;
            const wanted = new Map(dto.schedule.map((slot) => [
                slot.timeOfDay,
                slot.time ?? schedule_1.DEFAULT_SLOT_TIMES[slot.timeOfDay],
            ]));
            for (const slot of medication.slots) {
                const time = wanted.get(slot.timeOfDay);
                const upcoming = {
                    slotId: slot.id,
                    status: client_1.DoseStatus.PENDING,
                    scheduledAt: { gte: todayStart },
                };
                if (time === undefined) {
                    if (slot.isActive) {
                        await tx.doseEvent.deleteMany({ where: upcoming });
                        await tx.scheduleSlot.update({
                            where: { id: slot.id },
                            data: { isActive: false },
                        });
                    }
                    continue;
                }
                wanted.delete(slot.timeOfDay);
                if (slot.isActive && slot.time === time)
                    continue;
                await tx.scheduleSlot.update({
                    where: { id: slot.id },
                    data: { time, isActive: true },
                });
                await tx.doseEvent.deleteMany({ where: upcoming });
            }
            for (const [timeOfDay, time] of wanted) {
                await tx.scheduleSlot.create({
                    data: { medicationId: id, timeOfDay, time },
                });
            }
        });
        this.events.emit(medication.patientId, 'medication');
        return this.prisma.medication.findUniqueOrThrow({
            where: { id },
            include: withSchedule,
        });
    }
    async stop(id) {
        const medication = await this.findActive(id);
        await this.prisma.$transaction([
            this.prisma.doseEvent.deleteMany({
                where: {
                    slot: { medicationId: id },
                    status: client_1.DoseStatus.PENDING,
                    scheduledAt: { gte: (0, schedule_1.localDateTime)((0, schedule_1.localDateKey)(), '00:00') },
                },
            }),
            this.prisma.medication.update({
                where: { id },
                data: { isActive: false },
            }),
        ]);
        this.events.emit(medication.patientId, 'medication');
    }
    async findActive(id) {
        const medication = await this.prisma.medication.findFirst({
            where: { id, isActive: true },
            include: { slots: true },
        });
        if (!medication)
            throw new common_1.NotFoundException(`Medication ${id} not found`);
        return medication;
    }
};
exports.MedicationsService = MedicationsService;
exports.MedicationsService = MedicationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        care_events_service_1.CareEventsService])
], MedicationsService);
//# sourceMappingURL=medications.service.js.map