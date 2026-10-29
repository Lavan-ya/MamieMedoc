import { Injectable, NotFoundException } from '@nestjs/common';
import { DoseStatus, PrescriptionStatus } from '@prisma/client';
import {
  DEFAULT_SLOT_TIMES,
  localDateKey,
  localDateTime,
} from '../common/schedule';
import { CareEventsService } from '../events/care-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMedicationDto } from './dto/update-medication.dto';

const withSchedule = {
  slots: { where: { isActive: true }, orderBy: { time: 'asc' as const } },
  prescription: { select: { id: true, doctorName: true, issuedAt: true } },
};

/** Medications already on the patient's schedule (confirmed prescriptions). */
@Injectable()
export class MedicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: CareEventsService,
  ) {}

  list(patientId: number) {
    return this.prisma.medication.findMany({
      where: {
        patientId,
        isActive: true,
        OR: [
          { prescriptionId: null },
          { prescription: { status: PrescriptionStatus.ACTIVE } },
        ],
      },
      include: withSchedule,
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Changes intake times (and stock settings). Slots that already have dose
   * history are deactivated rather than deleted, so adherence stays intact.
   */
  async update(id: number, dto: UpdateMedicationDto) {
    const medication = await this.findActive(id);
    const dateKey = localDateKey();
    const todayStart = localDateTime(dateKey, '00:00');

    await this.prisma.$transaction(async (tx) => {
      await tx.medication.update({
        where: { id },
        data: {
          stockDoses: dto.stockDoses,
          lowStockAlert: dto.lowStockAlert,
        },
      });
      if (!dto.schedule) return;

      const wanted = new Map(
        dto.schedule.map((slot) => [
          slot.timeOfDay,
          slot.time ?? DEFAULT_SLOT_TIMES[slot.timeOfDay],
        ]),
      );

      for (const slot of medication.slots) {
        const time = wanted.get(slot.timeOfDay);
        // Doses not yet taken from today on follow the slot: moved or dropped.
        const upcoming = {
          slotId: slot.id,
          status: DoseStatus.PENDING,
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
        if (slot.isActive && slot.time === time) continue;
        await tx.scheduleSlot.update({
          where: { id: slot.id },
          data: { time, isActive: true },
        });
        // Today's pending dose is re-created at the new time on next read.
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

  /** Stops a medication: it leaves the schedule but its dose history is kept. */
  async stop(id: number) {
    const medication = await this.findActive(id);
    await this.prisma.$transaction([
      this.prisma.doseEvent.deleteMany({
        where: {
          slot: { medicationId: id },
          status: DoseStatus.PENDING,
          scheduledAt: { gte: localDateTime(localDateKey(), '00:00') },
        },
      }),
      this.prisma.medication.update({
        where: { id },
        data: { isActive: false },
      }),
    ]);
    this.events.emit(medication.patientId, 'medication');
  }

  private async findActive(id: number) {
    const medication = await this.prisma.medication.findFirst({
      where: { id, isActive: true },
      // All slots, including inactive ones, so a removed time can be reused.
      include: { slots: true },
    });
    if (!medication) throw new NotFoundException(`Medication ${id} not found`);
    return medication;
  }
}
