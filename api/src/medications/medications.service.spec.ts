import { NotFoundException } from '@nestjs/common';
import { DoseStatus, TimeOfDay } from '@prisma/client';
import { CareEventsService } from '../events/care-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { MedicationsService } from './medications.service';

describe('MedicationsService', () => {
  let prisma: {
    medication: {
      findFirst: jest.Mock;
      update: jest.Mock;
      findUniqueOrThrow: jest.Mock;
    };
    scheduleSlot: { update: jest.Mock; create: jest.Mock };
    doseEvent: { deleteMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let events: { emit: jest.Mock };
  let service: MedicationsService;

  beforeEach(() => {
    prisma = {
      medication: {
        findFirst: jest.fn(),
        update: jest.fn(),
        findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 5 }),
      },
      scheduleSlot: { update: jest.fn(), create: jest.fn() },
      doseEvent: { deleteMany: jest.fn() },
      // Interactive transactions get the same client; array ones run in order.
      $transaction: jest.fn((arg: unknown) =>
        typeof arg === 'function'
          ? (arg as (tx: unknown) => Promise<unknown>)(prisma)
          : Promise.all(arg as unknown[]),
      ),
    };
    events = { emit: jest.fn() };
    service = new MedicationsService(
      prisma as unknown as PrismaService,
      events as unknown as CareEventsService,
    );
  });

  describe('update', () => {
    beforeEach(() => {
      prisma.medication.findFirst.mockResolvedValue({
        id: 5,
        patientId: 2,
        slots: [
          {
            id: 1,
            timeOfDay: TimeOfDay.MORNING,
            time: '08:00',
            isActive: true,
          },
          { id: 2, timeOfDay: TimeOfDay.MIDDAY, time: '12:30', isActive: true },
          // Removed earlier; kept for its dose history
          {
            id: 3,
            timeOfDay: TimeOfDay.BEDTIME,
            time: '22:00',
            isActive: false,
          },
        ],
      });
    });

    it('moves, removes, re-activates and adds intake times', async () => {
      await service.update(5, {
        schedule: [
          { timeOfDay: TimeOfDay.MORNING, time: '09:00' },
          { timeOfDay: TimeOfDay.BEDTIME },
          { timeOfDay: TimeOfDay.EVENING, time: '19:45' },
        ],
      });

      // Morning moved to 09:00
      expect(prisma.scheduleSlot.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { time: '09:00', isActive: true },
      });
      // Midday removed: deactivated, not deleted
      expect(prisma.scheduleSlot.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { isActive: false },
      });
      // Bedtime re-used at its default time
      expect(prisma.scheduleSlot.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { time: '22:00', isActive: true },
      });
      // Evening is new
      expect(prisma.scheduleSlot.create).toHaveBeenCalledWith({
        data: {
          medicationId: 5,
          timeOfDay: TimeOfDay.EVENING,
          time: '19:45',
        },
      });
      expect(events.emit).toHaveBeenCalledWith(2, 'medication');
    });

    it("drops only the moved slot's untaken doses from today on", async () => {
      await service.update(5, {
        schedule: [
          { timeOfDay: TimeOfDay.MORNING, time: '09:00' },
          { timeOfDay: TimeOfDay.MIDDAY, time: '12:30' },
        ],
      });

      // Morning moved -> its pending dose is recreated at 09:00 on next read
      expect(prisma.doseEvent.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          slotId: 1,
          status: DoseStatus.PENDING,
        }),
      });
      // Midday unchanged -> untouched
      expect(prisma.doseEvent.deleteMany).not.toHaveBeenCalledWith({
        where: expect.objectContaining({ slotId: 2 }),
      });
      expect(prisma.scheduleSlot.create).not.toHaveBeenCalled();
    });

    it('only changes stock settings when no schedule is sent', async () => {
      await service.update(5, { stockDoses: 40 });

      expect(prisma.medication.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { stockDoses: 40, lowStockAlert: undefined },
      });
      expect(prisma.scheduleSlot.update).not.toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    it('deactivates the medication, drops untaken doses and notifies screens', async () => {
      prisma.medication.findFirst.mockResolvedValue({ id: 5, patientId: 2 });

      await service.stop(5);

      expect(prisma.medication.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: { isActive: false },
      });
      expect(prisma.doseEvent.deleteMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ status: DoseStatus.PENDING }),
      });
      expect(events.emit).toHaveBeenCalledWith(2, 'medication');
    });

    it('rejects a medication that is unknown or already stopped', async () => {
      prisma.medication.findFirst.mockResolvedValue(null);

      await expect(service.stop(5)).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
