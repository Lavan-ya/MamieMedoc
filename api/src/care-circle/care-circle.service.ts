import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DoseStatus,
  Medication,
  PrescriptionStatus,
  RefillStatus,
  ScheduleSlot,
} from '@prisma/client';
import { lastReminderExpiredBefore, MAX_SNOOZES } from '../common/reminders';
import {
  addDays,
  localDateKey,
  localDateTime,
  weekdayIndex,
} from '../common/schedule';
import { isLowStock } from '../common/stock';
import { CareEventsService } from '../events/care-events.service';
import { PrismaService } from '../prisma/prisma.service';

type MedicationWithSlots = Medication & { slots: ScheduleSlot[] };

/** One dose in the adherence history (family dashboard day details). */
export interface AdherenceDose {
  id: number;
  time: string;
  medication: string;
  status: DoseStatus;
  takenAt: Date | null;
  late: boolean;
}

const LATE_MS = 60 * 60_000;

function plural(unit: string, count: number) {
  return count > 1 && !unit.endsWith('s') ? `${unit}s` : unit;
}

@Injectable()
export class CareCircleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: CareEventsService,
  ) {}

  /** Everything the family dashboard shows, in one request. */
  async familyDashboard(patientId: number, days = 7) {
    const today = await this.today(patientId);
    const [stock, adherence] = await Promise.all([
      this.stock(patientId),
      this.adherence(patientId, days),
    ]);
    return { today, stock, adherence };
  }

  /**
   * Pending doses become MISSED once their day is over, or once Jeanne has
   * snoozed 3 times and left the last reminder unanswered (common/reminders.ts).
   * Runs before every read, so no background job is needed.
   */
  async markMissedDoses(patientId: number) {
    const { count } = await this.prisma.doseEvent.updateMany({
      where: {
        status: DoseStatus.PENDING,
        slot: { medication: { patientId } },
        OR: [
          // The day is over
          { scheduledAt: { lt: localDateTime(localDateKey(), '00:00') } },
          // Snoozed 3 times, then the last reminder went unanswered
          {
            snoozeCount: { gte: MAX_SNOOZES },
            snoozedUntil: { lt: lastReminderExpiredBefore() },
          },
        ],
      },
      data: { status: DoseStatus.MISSED },
    });
    if (count > 0) this.events.emit(patientId, 'dose');
    return count;
  }

  /** Everything the Mamie / care circle page shows for today. */
  async today(patientId: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { familyMembers: { orderBy: { callOrder: 'asc' } } },
    });
    if (!patient) throw new NotFoundException(`Patient ${patientId} not found`);

    await this.markMissedDoses(patientId);
    const medications = await this.activeMedications(patientId);
    const slots = medications.flatMap((medication) =>
      medication.slots.map((slot) => ({ slot, medication })),
    );

    // Dose events are created lazily the first time today's schedule is read,
    // so newly confirmed prescriptions show up without a cron job. Only slots
    // without a dose today get one: a slot whose time was edited after its
    // dose was taken keeps that single (taken) dose.
    const dateKey = localDateKey();
    const today = {
      slotId: { in: slots.map(({ slot }) => slot.id) },
      scheduledAt: {
        gte: localDateTime(dateKey, '00:00'),
        lte: localDateTime(dateKey, '23:59'),
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
          scheduledAt: localDateTime(dateKey, slot.time),
        })),
        skipDuplicates: true,
      });
    }

    const events =
      missing.length > 0
        ? await this.prisma.doseEvent.findMany({
            where: today,
            include: withConfirmer,
          })
        : existing;
    const eventBySlot = new Map(events.map((event) => [event.slotId, event]));

    const doses = slots
      .map(({ slot, medication }) => {
        const event = eventBySlot.get(slot.id)!;
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
          // null when Jeanne confirmed herself
          takenBy: event.confirmedBy?.firstName ?? null,
          // Reminder state for Jeanne's screen
          snoozedUntil: event.snoozedUntil,
          snoozesLeft: Math.max(0, MAX_SNOOZES - event.snoozeCount),
          stockLeft: medication.stockDoses,
          stockUnit: plural(medication.doseUnit, medication.stockDoses),
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    // Low stock and who in the family acknowledged it, for Jeanne's screen.
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

  /** Home stock per active medication, for the prescription & stock dashboard. */
  async stock(patientId: number) {
    const medications = await this.activeMedications(patientId);
    const refills = await this.prisma.refillRequest.findMany({
      where: {
        status: RefillStatus.PLANNED,
        medicationId: { in: medications.map((medication) => medication.id) },
      },
      include: { familyMember: { select: { firstName: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const refillByMedication = new Map(
      refills.map((refill) => [refill.medicationId, refill]),
    );

    return medications.map((medication) => {
      const refill = refillByMedication.get(medication.id);
      const dosesPerDay = medication.slots.length;
      const daysLeft =
        dosesPerDay > 0
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
        isLow: isLowStock({ ...medication, daysLeft }),
        renewalDate: medication.renewalDate,
        // The family member who acknowledged the low stock and will refill it.
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

  /**
   * Taken vs scheduled doses per day for the last `days` days (today last).
   * As-needed medications ("si douleur") are left out: skipping them is fine.
   */
  async adherence(patientId: number, days: number) {
    // Calendar days (not 24 h steps, which skip or repeat a day around DST).
    const today = localDateKey();
    const dayKeys = Array.from({ length: days }, (_, index) =>
      addDays(today, index - (days - 1)),
    );
    const todayKey = dayKeys[dayKeys.length - 1];

    await this.markMissedDoses(patientId);
    const events = await this.prisma.doseEvent.findMany({
      where: {
        scheduledAt: {
          gte: localDateTime(dayKeys[0], '00:00'),
          lte: localDateTime(todayKey, '23:59'),
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

    const byDay = new Map(
      dayKeys.map((key) => [
        key,
        { scheduled: 0, taken: 0, doses: [] as AdherenceDose[] },
      ]),
    );
    for (const event of events) {
      const day = byDay.get(localDateKey(event.scheduledAt));
      if (!day) continue;
      day.scheduled += 1;
      if (event.status === DoseStatus.TAKEN) day.taken += 1;
      day.doses.push({
        id: event.id,
        time: event.slot.time,
        medication:
          `${event.slot.medication.name} ${event.slot.medication.strength}`.trim(),
        status: event.status,
        takenAt: event.takenAt,
        // Taken more than an hour after its time
        late:
          event.takenAt !== null &&
          event.takenAt.getTime() - event.scheduledAt.getTime() > LATE_MS,
      });
    }

    const result = dayKeys.map((date) => {
      const { scheduled, taken, doses } = byDay.get(date)!;
      const status =
        date === todayKey
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

    // Score past days only: today is still in progress.
    const past = result.filter(
      (day) => day.status !== 'today' && day.scheduled > 0,
    );
    const scheduled = past.reduce((sum, day) => sum + day.scheduled, 0);
    const taken = past.reduce((sum, day) => sum + day.taken, 0);

    let streak = 0;
    for (const day of [...past].reverse()) {
      if (day.status !== 'complete') break;
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

  /**
   * Jeanne's weekly plant and her garden. Each calendar week (Monday-Sunday)
   * has its own plant; it grows one step on each day she takes every planned
   * medicine, and on Sunday night it joins the garden at the size it reached.
   */
  async garden(patientId: number, weeks: number) {
    const todayKey = localDateKey();
    const monday = addDays(todayKey, -weekdayIndex(todayKey));
    const firstMonday = addDays(monday, -7 * (weeks - 1));
    const { days } = await this.adherence(
      patientId,
      (weeks - 1) * 7 + weekdayIndex(todayKey) + 1,
    );
    const summary = (day: (typeof days)[number]) => ({
      date: day.date,
      status: day.status,
      scheduled: day.scheduled,
      taken: day.taken,
    });

    const pastWeeks = Array.from({ length: weeks - 1 }, (_, index) => {
      const start = addDays(firstMonday, index * 7);
      const week = days.filter(
        (day) => day.date >= start && day.date <= addDays(start, 6),
      );
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
        // Monday..today; the rest of the week is still to come.
        days: thisWeek.map(summary),
        // Growth so far, not counting today (the screen adds it once done).
        grownDays: thisWeek.filter((day) => day.status === 'complete').length,
      },
      // Past weeks' plants, oldest first; weeks before MamieMedoc are left out.
      garden: pastWeeks.filter((week) => week.trackedDays > 0),
    };
  }

  /** A family member commits to picking up a refill ("Je m'en occupe"). */
  async planRefill(
    patientId: number,
    medicationId: number,
    familyMemberId: number,
    plannedFor: string,
  ) {
    const [medication, member] = await Promise.all([
      this.prisma.medication.findFirst({
        where: { id: medicationId, patientId, isActive: true },
      }),
      this.prisma.familyMember.findFirst({
        where: { id: familyMemberId, patientId },
      }),
    ]);
    if (!medication) {
      throw new NotFoundException(`Medication ${medicationId} not found`);
    }
    if (!member) {
      throw new NotFoundException(`Family member ${familyMemberId} not found`);
    }

    // One planned pickup per medication: re-planning replaces it.
    const [, refill] = await this.prisma.$transaction([
      this.prisma.refillRequest.deleteMany({
        where: { medicationId, status: RefillStatus.PLANNED },
      }),
      this.prisma.refillRequest.create({
        data: { medicationId, familyMemberId, plannedFor },
      }),
    ]);
    this.events.emit(patientId, 'refill');
    return refill;
  }

  /**
   * The family member brought the medicine home: the refill is done and the
   * new box is added to the home stock, which clears the low-stock alert.
   */
  async completeRefill(patientId: number, refillId: number, doses: number) {
    const refill = await this.prisma.refillRequest.findFirst({
      where: { id: refillId, medication: { patientId } },
    });
    if (!refill) throw new NotFoundException(`Refill ${refillId} not found`);
    if (refill.status === RefillStatus.DONE) {
      throw new ConflictException(`Refill ${refillId} was already picked up`);
    }

    const [, medication] = await this.prisma.$transaction([
      this.prisma.refillRequest.update({
        where: { id: refillId },
        data: { status: RefillStatus.DONE },
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

  private activeMedications(patientId: number): Promise<MedicationWithSlots[]> {
    return this.prisma.medication.findMany({
      where: {
        patientId,
        isActive: true,
        OR: [
          { prescriptionId: null },
          { prescription: { status: PrescriptionStatus.ACTIVE } },
        ],
      },
      include: { slots: { where: { isActive: true } } },
      orderBy: { id: 'asc' },
    });
  }
}
