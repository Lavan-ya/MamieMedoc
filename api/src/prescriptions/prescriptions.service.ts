import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DoseStatus, PrescriptionStatus, RefillStatus } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import {
  DEFAULT_SLOT_TIMES,
  localDateKey,
  localDateTime,
} from '../common/schedule';
import { CareEventsService } from '../events/care-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfirmPrescriptionDto } from './dto/confirm-prescription.dto';
import {
  PRESCRIPTION_EXTRACTOR,
  type PrescriptionExtractor,
  type UploadedScan,
} from './extraction/prescription-extractor';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');
const SCANS_DIR = join(UPLOADS_DIR, 'prescriptions');

/** Same medicine = same name and strength, ignoring case and spacing. */
function sameMedicine(
  a: { name: string; strength: string },
  b: { name: string; strength: string },
) {
  const key = (m: { name: string; strength: string }) =>
    `${m.name} ${m.strength}`.trim().replace(/\s+/g, ' ').toLowerCase();
  return key(a) === key(b);
}

const withMedications = {
  medications: {
    include: {
      slots: { where: { isActive: true }, orderBy: { time: 'asc' as const } },
    },
    orderBy: { id: 'asc' as const },
  },
};

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: CareEventsService,
    @Inject(PRESCRIPTION_EXTRACTOR)
    private readonly extractor: PrescriptionExtractor,
  ) {}

  /** Reads the scan and stores the result as a DRAFT waiting for caregiver review. */
  async scan(patientId: number, scan: UploadedScan) {
    await this.assertPatientExists(patientId);

    const extracted = await this.extractor.extract(scan);
    if (extracted.medications.length === 0) {
      throw new BadRequestException(
        'No medication could be read from this prescription. Please retake the photo.',
      );
    }

    const fileName = `${randomUUID()}${extname(scan.originalName).toLowerCase()}`;
    await mkdir(SCANS_DIR, { recursive: true });
    await writeFile(join(SCANS_DIR, fileName), scan.buffer);

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
          status: PrescriptionStatus.DRAFT,
          medications: {
            create: extracted.medications.map(
              ({ schedule, ...medication }) => ({
                ...medication,
                patientId,
                stockDoses: medication.stockDoses ?? 0,
                // Hidden from the care circle until the caregiver confirms.
                isActive: false,
                slots: {
                  create: schedule.map((timeOfDay) => ({
                    timeOfDay,
                    time: DEFAULT_SLOT_TIMES[timeOfDay],
                  })),
                },
              }),
            ),
          },
        },
        include: withMedications,
      });
    } catch (error) {
      await rm(join(SCANS_DIR, fileName), { force: true });
      throw error;
    }
  }

  list(patientId: number, status?: PrescriptionStatus) {
    return this.prisma.prescription.findMany({
      where: { patientId, status },
      include: withMedications,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: withMedications,
    });
    if (!prescription)
      throw new NotFoundException(`Prescription ${id} not found`);
    return prescription;
  }

  /**
   * Saves the reviewed schedule: the prescription becomes ACTIVE (so it leaves
   * the review list) and its medications appear in the patient's care circle.
   */
  async confirm(id: number, dto: ConfirmPrescriptionDto) {
    const draft = await this.findDraft(id);

    const draftIds = new Set(
      draft.medications.map((medication) => medication.id),
    );
    const unknown = dto.medications.filter(
      (medication) => !draftIds.has(medication.id),
    );
    if (unknown.length > 0) {
      throw new BadRequestException(
        `Medications ${unknown.map((m) => m.id).join(', ')} do not belong to prescription ${id}`,
      );
    }
    const keptIds = dto.medications.map((medication) => medication.id);
    const discardedIds = [...draftIds].filter(
      (medId) => !keptIds.includes(medId),
    );

    const replacedMedications: { id: number; name: string }[] = [];
    await this.prisma.$transaction(async (tx) => {
      await tx.scheduleSlot.deleteMany({
        where: { medicationId: { in: [...draftIds] } },
      });
      await tx.medication.deleteMany({ where: { id: { in: discardedIds } } });

      // Medicines Jeanne already takes, from other prescriptions
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
                time: slot.time ?? DEFAULT_SLOT_TIMES[slot.timeOfDay],
              })),
            },
          },
          include: { slots: true },
        });

        // A renewed prescription replaces the same medicine instead of
        // putting it on the schedule twice.
        for (const previous of current.filter((old) =>
          sameMedicine(old, confirmed),
        )) {
          await this.replaceMedication(tx, previous, confirmed);
          replacedMedications.push({ id: previous.id, name: previous.name });
        }
      }

      await tx.prescription.update({
        where: { id },
        data: { status: PrescriptionStatus.ACTIVE },
      });
    });

    this.events.emit(draft.patientId, 'prescription');
    return { ...(await this.findOne(id)), replacedMedications };
  }

  /**
   * Hands an old medicine over to its renewal: today's doses move to the new
   * schedule (a dose already taken this morning is not asked for again), the
   * pills left at home are added to the new stock, a planned refill follows,
   * and the old medicine stops. Its past history is kept.
   */
  private async replaceMedication(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    previous: { id: number; stockDoses: number },
    renewed: {
      id: number;
      slots: { id: number; timeOfDay: string; time: string }[];
    },
  ) {
    const todayKey = localDateKey();
    const fromToday = localDateTime(todayKey, '00:00');
    const endOfToday = localDateTime(todayKey, '23:59');

    const todays = await tx.doseEvent.findMany({
      where: {
        slot: { medicationId: previous.id },
        scheduledAt: { gte: fromToday, lte: endOfToday },
      },
      include: { slot: true },
    });
    const usedSlots = new Set<number>();
    for (const dose of todays) {
      const slot = renewed.slots.find(
        (candidate) =>
          candidate.timeOfDay === dose.slot.timeOfDay &&
          !usedSlots.has(candidate.id),
      );
      if (slot) {
        usedSlots.add(slot.id);
        await tx.doseEvent.update({
          where: { id: dose.id },
          data: {
            slotId: slot.id,
            scheduledAt: localDateTime(todayKey, slot.time),
          },
        });
      } else if (dose.status === DoseStatus.PENDING) {
        await tx.doseEvent.delete({ where: { id: dose.id } });
      }
    }
    // Doses of later days that were already created are not needed any more.
    await tx.doseEvent.deleteMany({
      where: {
        slot: { medicationId: previous.id },
        status: DoseStatus.PENDING,
        scheduledAt: { gt: endOfToday },
      },
    });

    await tx.refillRequest.updateMany({
      where: { medicationId: previous.id, status: RefillStatus.PLANNED },
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

  /** Throws away a draft (e.g. blurry scan) together with its stored image. */
  async discard(id: number) {
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
      await rm(join(process.cwd(), draft.imageUrl), { force: true });
    }
  }

  private async findDraft(id: number) {
    const prescription = await this.findOne(id);
    if (prescription.status !== PrescriptionStatus.DRAFT) {
      throw new ConflictException(
        `Prescription ${id} has already been reviewed`,
      );
    }
    return prescription;
  }

  private async assertPatientExists(patientId: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) throw new NotFoundException(`Patient ${patientId} not found`);
  }
}
