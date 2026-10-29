import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { DoseStatus } from '@prisma/client';
import { MAX_SNOOZES } from '../common/reminders';
import { localDateKey, localDateTime } from '../common/schedule';
import { CareCircleService } from '../care-circle/care-circle.service';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';

interface ReminderState {
  status: DoseStatus;
  scheduledAt: Date;
  snoozedUntil: Date | null;
  remindedAt: Date | null;
}

/**
 * A pending dose gets one push when it comes due, and one more each time a
 * snooze ends ("Remind me in 15 minutes").
 */
export function needsReminder(dose: ReminderState, now: Date) {
  if (dose.status !== DoseStatus.PENDING) return false;
  const dueAt = dose.snoozedUntil ?? dose.scheduledAt;
  if (dueAt > now) return false;
  return dose.remindedAt === null || dose.remindedAt < dueAt;
}

/**
 * Sends medication reminders by Web Push every minute, so they reach Jeanne's
 * tablet even when MamieMédoc is closed or the screen is locked. Also marks
 * missed doses on time, without waiting for someone to open a page.
 * Single-instance: several API instances would send duplicates.
 */
@Injectable()
export class ReminderSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReminderSchedulerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly careCircle: CareCircleService,
    private readonly push: PushService,
  ) {}

  onModuleInit() {
    if (process.env.PUSH_REMINDERS === 'off' || !this.push.enabled) return;
    // Read here, after main.ts has loaded api/.env
    const tickMs = Number(process.env.REMINDER_INTERVAL_MS ?? 60_000);
    this.timer = setInterval(() => void this.tick(), tickMs);
    this.logger.log(`Push reminders on (every ${tickMs / 1000}s)`);
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  /** One pass over every patient with a subscribed device. */
  async tick(now = new Date()) {
    if (this.running) return 0; // a slow pass must not overlap the next one
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
    } catch (error) {
      this.logger.error(`Reminder pass failed: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
    return sent;
  }

  private async remindPatient(patientId: number, now: Date) {
    // Creates today's doses if needed and marks missed ones (and tells screens).
    await this.careCircle.today(patientId);

    const doses = await this.prisma.doseEvent.findMany({
      where: {
        status: DoseStatus.PENDING,
        scheduledAt: {
          gte: localDateTime(localDateKey(now), '00:00'),
          lte: now,
        },
        slot: { isActive: true, medication: { patientId, isActive: true } },
      },
      include: { slot: { include: { medication: true } } },
      orderBy: { scheduledAt: 'asc' },
    });

    let sent = 0;
    for (const dose of doses.filter((candidate) =>
      needsReminder(candidate, now),
    )) {
      const medication = dose.slot.medication;
      const snoozesLeft = Math.max(0, MAX_SNOOZES - dose.snoozeCount);
      const quantity = `${medication.doseQuantity} ${medication.doseUnit}${medication.doseQuantity > 1 && !medication.doseUnit.endsWith('s') ? 's' : ''}`;
      // Mark first: a failed push is not retried every minute.
      await this.prisma.doseEvent.update({
        where: { id: dose.id },
        data: { remindedAt: now },
      });
      sent += await this.push.sendToPatient(patientId, {
        doseId: dose.id,
        title:
          snoozesLeft === 0
            ? 'Last reminder: your medicine'
            : 'Time for your medicine',
        body: `${medication.name} ${medication.strength} · ${quantity}, ${medication.instruction}`,
        snoozesLeft,
      });
    }
    return sent;
  }
}
