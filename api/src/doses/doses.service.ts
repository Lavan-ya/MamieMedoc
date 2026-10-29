import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DoseStatus } from '@prisma/client';
import { MAX_SNOOZES, snoozeUntil } from '../common/reminders';
import { CareEventsService } from '../events/care-events.service';
import { PrismaService } from '../prisma/prisma.service';

/** Dose actions from Jeanne's own screen. Family members only follow them. */
@Injectable()
export class DosesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: CareEventsService,
  ) {}

  /**
   * "I have taken my medicine": records the dose and takes it out of the home
   * stock. Confirming twice is harmless: the second call changes nothing.
   * A dose marked missed can still be confirmed if Jeanne took it late.
   */
  async markTaken(id: number) {
    const dose = await this.findDose(id);
    if (dose.status === DoseStatus.TAKEN) return dose;

    const [updated] = await this.prisma.$transaction([
      this.prisma.doseEvent.update({
        where: { id },
        data: {
          status: DoseStatus.TAKEN,
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

  /** "Remind me later": the reminder comes back in 15 minutes, at most 3 times. */
  async snooze(id: number) {
    const dose = await this.findDose(id);
    if (dose.status !== DoseStatus.PENDING) {
      throw new ConflictException(`Dose ${id} is no longer waiting`);
    }
    if (dose.snoozeCount >= MAX_SNOOZES) {
      throw new ConflictException(
        `Dose ${id} was already snoozed ${MAX_SNOOZES} times`,
      );
    }

    const updated = await this.prisma.doseEvent.update({
      where: { id },
      data: {
        snoozeCount: { increment: 1 },
        snoozedUntil: snoozeUntil(),
      },
    });
    this.events.emit(dose.slot.medication.patientId, 'dose');
    return updated;
  }

  private async findDose(id: number) {
    const dose = await this.prisma.doseEvent.findUnique({
      where: { id },
      include: {
        slot: { include: { medication: { select: { patientId: true } } } },
      },
    });
    if (!dose) throw new NotFoundException(`Dose ${id} not found`);
    return dose;
  }
}
