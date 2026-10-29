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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionsService = exports.UPLOADS_DIR = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const schedule_1 = require("../common/schedule");
const care_events_service_1 = require("../events/care-events.service");
const prisma_service_1 = require("../prisma/prisma.service");
const prescription_extractor_1 = require("./extraction/prescription-extractor");
exports.UPLOADS_DIR = (0, node_path_1.join)(process.cwd(), 'uploads');
const SCANS_DIR = (0, node_path_1.join)(exports.UPLOADS_DIR, 'prescriptions');
function sameMedicine(a, b) {
    const key = (m) => `${m.name} ${m.strength}`.trim().replace(/\s+/g, ' ').toLowerCase();
    return key(a) === key(b);
}
const withMedications = {
    medications: {
        include: {
            slots: { where: { isActive: true }, orderBy: { time: 'asc' } },
        },
        orderBy: { id: 'asc' },
    },
};
let PrescriptionsService = class PrescriptionsService {
    prisma;
    events;
    extractor;
    constructor(prisma, events, extractor) {
        this.prisma = prisma;
        this.events = events;
        this.extractor = extractor;
    }
    async scan(patientId, scan) {
        await this.assertPatientExists(patientId);
        const extracted = await this.extractor.extract(scan);
        if (extracted.medications.length === 0) {
            throw new common_1.BadRequestException('No medication could be read from this prescription. Please retake the photo.');
        }
        const fileName = `${(0, node_crypto_1.randomUUID)()}${(0, node_path_1.extname)(scan.originalName).toLowerCase()}`;
        await (0, promises_1.mkdir)(SCANS_DIR, { recursive: true });
        await (0, promises_1.writeFile)((0, node_path_1.join)(SCANS_DIR, fileName), scan.buffer);
        try {
            return await this.prisma.prescription.create({
                data: {
                    patientId,
                    doctorName: extracted.doctorName,
                    doctorSpecialty: extracted.doctorSpecialty,
                    clinicName: extracted.clinicName,
                    clinicPhone: extracted.clinicPhone,
                    pharmacyName: extracted.pharmacyName,
                    issuedAt: extracted.issuedAt,
                    imageUrl: `/uploads/prescriptions/${fileName}`,
                    ocrConfidence: extracted.confidence,
                    status: client_1.PrescriptionStatus.DRAFT,
                    medications: {
                        create: extracted.medications.map(({ schedule, ...medication }) => ({
                            ...medication,
                            patientId,
                            stockDoses: medication.stockDoses ?? 0,
                            isActive: false,
                            slots: {
                                create: schedule.map((timeOfDay) => ({
                                    timeOfDay,
                                    time: schedule_1.DEFAULT_SLOT_TIMES[timeOfDay],
                                })),
                            },
                        })),
                    },
                },
                include: withMedications,
            });
        }
        catch (error) {
            await (0, promises_1.rm)((0, node_path_1.join)(SCANS_DIR, fileName), { force: true });
            throw error;
        }
    }
    list(patientId, status) {
        return this.prisma.prescription.findMany({
            where: { patientId, status },
            include: withMedications,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const prescription = await this.prisma.prescription.findUnique({
            where: { id },
            include: withMedications,
        });
        if (!prescription)
            throw new common_1.NotFoundException(`Prescription ${id} not found`);
        return prescription;
    }
    async confirm(id, dto) {
        const draft = await this.findDraft(id);
        const draftIds = new Set(draft.medications.map((medication) => medication.id));
        const unknown = dto.medications.filter((medication) => !draftIds.has(medication.id));
        if (unknown.length > 0) {
            throw new common_1.BadRequestException(`Medications ${unknown.map((m) => m.id).join(', ')} do not belong to prescription ${id}`);
        }
        const keptIds = dto.medications.map((medication) => medication.id);
        const discardedIds = [...draftIds].filter((medId) => !keptIds.includes(medId));
        const replacedMedications = [];
        await this.prisma.$transaction(async (tx) => {
            await tx.scheduleSlot.deleteMany({
                where: { medicationId: { in: [...draftIds] } },
            });
            await tx.medication.deleteMany({ where: { id: { in: discardedIds } } });
            const current = await tx.medication.findMany({
                where: {
                    patientId: draft.patientId,
                    isActive: true,
                    id: { notIn: [...draftIds] },
                },
                include: { slots: { where: { isActive: true } } },
            });
            for (const medication of dto.medications) {
                const confirmed = await tx.medication.update({
                    where: { id: medication.id },
                    data: {
                        isActive: true,
                        stockDoses: medication.stockDoses,
                        lowStockAlert: medication.lowStockAlert,
                        lowStockThresholdDays: medication.lowStockThresholdDays,
                        slots: {
                            create: medication.schedule.map((slot) => ({
                                timeOfDay: slot.timeOfDay,
                                time: slot.time ?? schedule_1.DEFAULT_SLOT_TIMES[slot.timeOfDay],
                            })),
                        },
                    },
                    include: { slots: true },
                });
                for (const previous of current.filter((old) => sameMedicine(old, confirmed))) {
                    await this.replaceMedication(tx, previous, confirmed);
                    replacedMedications.push({ id: previous.id, name: previous.name });
                }
            }
            await tx.prescription.update({
                where: { id },
                data: { status: client_1.PrescriptionStatus.ACTIVE },
            });
        });
        this.events.emit(draft.patientId, 'prescription');
        return { ...(await this.findOne(id)), replacedMedications };
    }
    async replaceMedication(tx, previous, renewed) {
        const todayKey = (0, schedule_1.localDateKey)();
        const fromToday = (0, schedule_1.localDateTime)(todayKey, '00:00');
        const endOfToday = (0, schedule_1.localDateTime)(todayKey, '23:59');
        const todays = await tx.doseEvent.findMany({
            where: {
                slot: { medicationId: previous.id },
                scheduledAt: { gte: fromToday, lte: endOfToday },
            },
            include: { slot: true },
        });
        const usedSlots = new Set();
        for (const dose of todays) {
            const slot = renewed.slots.find((candidate) => candidate.timeOfDay === dose.slot.timeOfDay &&
                !usedSlots.has(candidate.id));
            if (slot) {
                usedSlots.add(slot.id);
                await tx.doseEvent.update({
                    where: { id: dose.id },
                    data: {
                        slotId: slot.id,
                        scheduledAt: (0, schedule_1.localDateTime)(todayKey, slot.time),
                    },
                });
            }
            else if (dose.status === client_1.DoseStatus.PENDING) {
                await tx.doseEvent.delete({ where: { id: dose.id } });
            }
        }
        await tx.doseEvent.deleteMany({
            where: {
                slot: { medicationId: previous.id },
                status: client_1.DoseStatus.PENDING,
                scheduledAt: { gt: endOfToday },
            },
        });
        await tx.refillRequest.updateMany({
            where: { medicationId: previous.id, status: client_1.RefillStatus.PLANNED },
            data: { medicationId: renewed.id },
        });
        await tx.medication.update({
            where: { id: renewed.id },
            data: { stockDoses: { increment: previous.stockDoses } },
        });
        await tx.medication.update({
            where: { id: previous.id },
            data: { isActive: false },
        });
    }
    async discard(id) {
        const draft = await this.findDraft(id);
        const medicationIds = draft.medications.map((medication) => medication.id);
        await this.prisma.$transaction([
            this.prisma.scheduleSlot.deleteMany({
                where: { medicationId: { in: medicationIds } },
            }),
            this.prisma.medication.deleteMany({
                where: { id: { in: medicationIds } },
            }),
            this.prisma.prescription.delete({ where: { id } }),
        ]);
        if (draft.imageUrl) {
            await (0, promises_1.rm)((0, node_path_1.join)(process.cwd(), draft.imageUrl), { force: true });
        }
    }
    async findDraft(id) {
        const prescription = await this.findOne(id);
        if (prescription.status !== client_1.PrescriptionStatus.DRAFT) {
            throw new common_1.ConflictException(`Prescription ${id} has already been reviewed`);
        }
        return prescription;
    }
    async assertPatientExists(patientId) {
        const patient = await this.prisma.patient.findUnique({
            where: { id: patientId },
        });
        if (!patient)
            throw new common_1.NotFoundException(`Patient ${patientId} not found`);
    }
};
exports.PrescriptionsService = PrescriptionsService;
exports.PrescriptionsService = PrescriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(prescription_extractor_1.PRESCRIPTION_EXTRACTOR)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        care_events_service_1.CareEventsService, Object])
], PrescriptionsService);
//# sourceMappingURL=prescriptions.service.js.map