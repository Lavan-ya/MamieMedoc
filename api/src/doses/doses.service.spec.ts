import { ConflictException, NotFoundException } from '@nestjs/common';
import { DoseStatus } from '@prisma/client';
import { CareEventsService } from '../events/care-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { DosesService } from './doses.service';

function dose(status: DoseStatus, snoozeCount = 0) {
  return {
    id: 7,
    status,
    snoozeCount,
    slot: { medicationId: 3, medication: { patientId: 2 } },
  };
}

describe('DosesService', () => {
  let prisma: {
    doseEvent: { findUnique: jest.Mock; update: jest.Mock };
    medication: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let events: { emit: jest.Mock };
  let service: DosesService;

  beforeEach(() => {
    prisma = {
      doseEvent: {
        findUnique: jest.fn(),
        update: jest.fn((args) => ({ id: args.where.id, ...args.data })),
      },
      medication: { updateMany: jest.fn() },
      $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
    };
    events = { emit: jest.fn() };
    service = new DosesService(
      prisma as unknown as PrismaService,
      events as unknown as CareEventsService,
    );
  });

  describe('markTaken', () => {
    it('marks a pending dose taken, takes it out of stock and notifies screens', async () => {
      prisma.doseEvent.findUnique.mockResolvedValue(dose(DoseStatus.PENDING));

      const result = await service.markTaken(7);

      expect(result).toMatchObject({
        status: DoseStatus.TAKEN,
        snoozedUntil: null,
      });
      expect(prisma.medication.updateMany).toHaveBeenCalledWith({
        where: { id: 3, stockDoses: { gt: 0 } },
        data: { stockDoses: { decrement: 1 } },
      });
      expect(events.emit).toHaveBeenCalledWith(2, 'dose');
    });

    it('accepts a late confirmation of a missed dose', async () => {
      prisma.doseEvent.findUnique.mockResolvedValue(dose(DoseStatus.MISSED));

      const result = await service.markTaken(7);

      expect(result).toMatchObject({ status: DoseStatus.TAKEN });
    });

    it('does nothing when the dose is already taken (no double stock decrement)', async () => {
      prisma.doseEvent.findUnique.mockResolvedValue(dose(DoseStatus.TAKEN));

      await service.markTaken(7);

      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(events.emit).not.toHaveBeenCalled();
    });

    it('rejects an unknown dose', async () => {
      prisma.doseEvent.findUnique.mockResolvedValue(null);

      await expect(service.markTaken(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('snooze', () => {
    beforeEach(() =>
      jest.useFakeTimers({ now: new Date('2026-10-29T07:00:00Z') }),
    );
    afterEach(() => jest.useRealTimers());

    it('brings the reminder back in 15 minutes and counts the snooze', async () => {
      prisma.doseEvent.findUnique.mockResolvedValue(
        dose(DoseStatus.PENDING, 1),
      );

      await service.snooze(7);

      expect(prisma.doseEvent.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: {
          snoozeCount: { increment: 1 },
          snoozedUntil: new Date('2026-10-29T07:15:00Z'),
        },
      });
      expect(events.emit).toHaveBeenCalledWith(2, 'dose');
    });

    it('refuses a fourth snooze', async () => {
      prisma.doseEvent.findUnique.mockResolvedValue(
        dose(DoseStatus.PENDING, 3),
      );

      await expect(service.snooze(7)).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.doseEvent.update).not.toHaveBeenCalled();
    });

    it('refuses to snooze a dose that is taken or missed', async () => {
      prisma.doseEvent.findUnique.mockResolvedValue(dose(DoseStatus.MISSED));

      await expect(service.snooze(7)).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
