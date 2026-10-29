import { ConflictException, NotFoundException } from '@nestjs/common';
import { DoseStatus, RefillStatus } from '@prisma/client';
import { localDateTime } from '../common/schedule';
import { CareEventsService } from '../events/care-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { CareCircleService } from './care-circle.service';

// Thursday 29 October 2026, 11:00 in Paris
const NOW = new Date('2026-10-29T10:00:00Z');

function doses(date: string, statuses: DoseStatus[]) {
  const scheduledAt = localDateTime(date, '08:00');
  return statuses.map((status, index) => ({
    id: index,
    scheduledAt,
    status,
    // One taken on time, the next 2 hours late
    takenAt:
      status === DoseStatus.TAKEN
        ? new Date(scheduledAt.getTime() + (index % 2 ? 120 : 5) * 60_000)
        : null,
    slot: {
      time: '08:00',
      medication: { name: 'Metformin', strength: '500 mg' },
    },
  }));
}

describe('CareCircleService', () => {
  const { TAKEN, PENDING, MISSED } = DoseStatus;
  let prisma: {
    doseEvent: { findMany: jest.Mock; updateMany: jest.Mock };
    refillRequest: {
      findFirst: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
      create: jest.Mock;
    };
    medication: { findFirst: jest.Mock; update: jest.Mock };
    familyMember: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let events: { emit: jest.Mock };
  let service: CareCircleService;

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });
    prisma = {
      doseEvent: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      refillRequest: {
        findFirst: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn((args) => ({ id: 9, ...args.data })),
      },
      medication: {
        findFirst: jest.fn(),
        update: jest.fn((args) => ({ id: args.where.id, stockDoses: 35 })),
      },
      familyMember: { findFirst: jest.fn() },
      $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
    };
    events = { emit: jest.fn() };
    service = new CareCircleService(
      prisma as unknown as PrismaService,
      events as unknown as CareEventsService,
    );
  });

  afterEach(() => jest.useRealTimers());

  describe('adherence', () => {
    it('scores each day and the week from taken vs scheduled doses', async () => {
      prisma.doseEvent.findMany.mockResolvedValue([
        ...doses('2026-10-23', [TAKEN, TAKEN]), // complete
        ...doses('2026-10-24', [TAKEN, MISSED]), // partial
        ...doses('2026-10-25', [MISSED, MISSED]), // missed
        // 26th: nothing recorded
        ...doses('2026-10-27', [TAKEN, TAKEN]), // complete
        ...doses('2026-10-28', [TAKEN]), // complete
        ...doses('2026-10-29', [TAKEN, PENDING]), // today
      ]);

      const result = await service.adherence(2, 7);

      expect(result.days.map((day) => [day.date, day.status])).toEqual([
        ['2026-10-23', 'complete'],
        ['2026-10-24', 'partial'],
        ['2026-10-25', 'missed'],
        ['2026-10-26', 'none'],
        ['2026-10-27', 'complete'],
        ['2026-10-28', 'complete'],
        ['2026-10-29', 'today'],
      ]);
      // Past days only: 6 taken of 9 scheduled
      expect(result.percent).toBe(67);
      expect(result.daysTracked).toBe(5);
      expect(result.daysOnTrack).toBe(3);
      // 27th and 28th complete; the 25th broke the streak (the 26th has no data)
      expect(result.streak).toBe(2);
    });

    it("lists each day's doses with when they were taken and if late", async () => {
      prisma.doseEvent.findMany.mockResolvedValue(
        doses('2026-10-27', [TAKEN, TAKEN, MISSED]),
      );

      const result = await service.adherence(2, 7);
      const day = result.days.find((entry) => entry.date === '2026-10-27')!;

      expect(day.doses).toEqual([
        expect.objectContaining({
          medication: 'Metformin 500 mg',
          status: TAKEN,
          late: false,
        }),
        expect.objectContaining({ status: TAKEN, late: true }),
        expect.objectContaining({ status: MISSED, takenAt: null, late: false }),
      ]);
    });

    it('returns no percentage when nothing was scheduled', async () => {
      const result = await service.adherence(2, 7);

      expect(result.percent).toBeNull();
      expect(result.streak).toBe(0);
      expect(result.days).toHaveLength(7);
    });

    it('leaves as-needed medications out of the score', async () => {
      await service.adherence(2, 7);

      expect(prisma.doseEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            slot: { medication: { patientId: 2, asNeeded: false } },
          }),
        }),
      );
    });
  });

  describe('garden', () => {
    it("groups days into Monday-Sunday weeks: this week's plant and past plants", async () => {
      // Today: Thursday 29 October. Week of 19 Oct: 5 complete days of 6 tracked.
      prisma.doseEvent.findMany.mockResolvedValue([
        ...doses('2026-10-19', [TAKEN]),
        ...doses('2026-10-20', [TAKEN]),
        ...doses('2026-10-21', [TAKEN, MISSED]),
        ...doses('2026-10-22', [TAKEN]),
        ...doses('2026-10-23', [TAKEN]),
        ...doses('2026-10-24', [TAKEN]),
        ...doses('2026-10-26', [TAKEN]),
        ...doses('2026-10-27', [MISSED]),
        ...doses('2026-10-28', [TAKEN]),
        ...doses('2026-10-29', [TAKEN, PENDING]),
      ]);

      const result = await service.garden(2, 3);

      expect(result.week.weekStart).toBe('2026-10-26');
      expect(result.week.days.map((day) => day.date)).toEqual([
        '2026-10-26',
        '2026-10-27',
        '2026-10-28',
        '2026-10-29',
      ]);
      // Monday and Wednesday; today is still in progress
      expect(result.week.grownDays).toBe(2);
      // The week of 12 Oct had no data and is left out of the garden
      expect(result.garden).toEqual([
        { weekStart: '2026-10-19', grownDays: 5, trackedDays: 6 },
      ]);
    });
  });

  describe('markMissedDoses', () => {
    it('marks doses missed after the day ends or after an unanswered last reminder', async () => {
      prisma.doseEvent.updateMany.mockResolvedValue({ count: 3 });

      await expect(service.markMissedDoses(2)).resolves.toBe(3);
      expect(prisma.doseEvent.updateMany).toHaveBeenCalledWith({
        where: {
          status: PENDING,
          slot: { medication: { patientId: 2 } },
          OR: [
            { scheduledAt: { lt: localDateTime('2026-10-29', '00:00') } },
            {
              snoozeCount: { gte: 3 },
              // last reminder shown 15 minutes ago or more
              snoozedUntil: { lt: new Date('2026-10-29T09:45:00Z') },
            },
          ],
        },
        data: { status: MISSED },
      });
      // Family dashboards refresh to show the missed doses
      expect(events.emit).toHaveBeenCalledWith(2, 'dose');
    });

    it('stays quiet when nothing was missed', async () => {
      await service.markMissedDoses(2);

      expect(events.emit).not.toHaveBeenCalled();
    });
  });

  describe('completeRefill', () => {
    it('closes the refill, adds the box to stock and notifies screens', async () => {
      prisma.refillRequest.findFirst.mockResolvedValue({
        id: 4,
        medicationId: 36,
        status: RefillStatus.PLANNED,
      });

      const result = await service.completeRefill(2, 4, 30);

      expect(prisma.refillRequest.update).toHaveBeenCalledWith({
        where: { id: 4 },
        data: { status: RefillStatus.DONE },
      });
      expect(prisma.medication.update).toHaveBeenCalledWith({
        where: { id: 36 },
        data: { stockDoses: { increment: 30 } },
      });
      expect(result).toEqual({ refillId: 4, medicationId: 36, stockDoses: 35 });
      expect(events.emit).toHaveBeenCalledWith(2, 'refill');
    });

    it('refuses a refill that was already picked up', async () => {
      prisma.refillRequest.findFirst.mockResolvedValue({
        id: 4,
        medicationId: 36,
        status: RefillStatus.DONE,
      });

      await expect(service.completeRefill(2, 4, 30)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("refuses another patient's refill", async () => {
      prisma.refillRequest.findFirst.mockResolvedValue(null);

      await expect(service.completeRefill(999, 4, 30)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('planRefill', () => {
    it('replaces any earlier plan for the medication', async () => {
      prisma.medication.findFirst.mockResolvedValue({ id: 36 });
      prisma.familyMember.findFirst.mockResolvedValue({ id: 4 });

      await service.planRefill(2, 36, 4, 'Tomorrow morning');

      expect(prisma.refillRequest.deleteMany).toHaveBeenCalledWith({
        where: { medicationId: 36, status: RefillStatus.PLANNED },
      });
      expect(prisma.refillRequest.create).toHaveBeenCalledWith({
        data: {
          medicationId: 36,
          familyMemberId: 4,
          plannedFor: 'Tomorrow morning',
        },
      });
      expect(events.emit).toHaveBeenCalledWith(2, 'refill');
    });

    it('rejects a family member from another patient', async () => {
      prisma.medication.findFirst.mockResolvedValue({ id: 36 });
      prisma.familyMember.findFirst.mockResolvedValue(null);

      await expect(
        service.planRefill(2, 36, 99, 'Today'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.refillRequest.create).not.toHaveBeenCalled();
    });
  });
});
