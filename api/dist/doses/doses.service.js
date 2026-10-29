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
exports.DosesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const reminders_1 = require("../common/reminders");
const care_events_service_1 = require("../events/care-events.service");
const prisma_service_1 = require("../prisma/prisma.service");
let DosesService = class DosesService {
    prisma;
    events;
    constructor(prisma, events) {
        this.prisma = prisma;
        this.events = events;
    }
    async markTaken(id) {
        const dose = await this.findDose(id);
        if (dose.status === client_1.DoseStatus.TAKEN)
            return dose;
        const [updated] = await this.prisma.$transaction([
            this.prisma.doseEvent.update({
                where: { id },
                data: {
                    status: client_1.DoseStatus.TAKEN,
                    takenAt: new Date(),
                    snoozedUntil: null,
                },
            }),
            this.prisma.medication.updateMany({
                where: { id: dose.slot.medicationId, stockDoses: { gt: 0 } },
                data: { stockDoses: { decrement: 1 } },
            }),
        ]);
        this.events.emit(dose.slot.medication.patientId, 'dose');
        return updated;
    }
    async snooze(id) {
        const dose = await this.findDose(id);
        if (dose.status !== client_1.DoseStatus.PENDING) {
            throw new common_1.ConflictException(`Dose ${id} is no longer waiting`);
        }
        if (dose.snoozeCount >= reminders_1.MAX_SNOOZES) {
            throw new common_1.ConflictException(`Dose ${id} was already snoozed ${reminders_1.MAX_SNOOZES} times`);
        }
        const updated = await this.prisma.doseEvent.update({
            where: { id },
            data: {
                snoozeCount: { increment: 1 },
                snoozedUntil: (0, reminders_1.snoozeUntil)(),
            },
        });
        this.events.emit(dose.slot.medication.patientId, 'dose');
        return updated;
    }
    async findDose(id) {
        const dose = await this.prisma.doseEvent.findUnique({
            where: { id },
            include: {
                slot: { include: { medication: { select: { patientId: true } } } },
            },
        });
        if (!dose)
            throw new common_1.NotFoundException(`Dose ${id} not found`);
        return dose;
    }
};
exports.DosesService = DosesService;
exports.DosesService = DosesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        care_events_service_1.CareEventsService])
], DosesService);
//# sourceMappingURL=doses.service.js.map