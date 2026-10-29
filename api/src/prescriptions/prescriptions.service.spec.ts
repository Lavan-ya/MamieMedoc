import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrescriptionStatus, TimeOfDay } from '@prisma/client';
import { CareEventsService } from '../events/care-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrescriptionExtractor } from './extraction/prescription-extractor';
import { PrescriptionsService } from './prescriptions.service';

const scan = {
  buffer: Buffer.from('photo'),
  mimeType: 'image/jpeg',
  originalName: 'ordonnance.jpg',
};

function draft(status: PrescriptionStatus = PrescriptionStatus.DRAFT) {
  return {
    id: 3,
    patientId: 2,
    status,
    imageUrl: null,
    medications: [{ id: 7 }, { id: 8 }, { id: 9 }],
  };
}

describe('PrescriptionsService', () => {
  let prisma: {
    patient: { findUnique: jest.Mock };
    prescription: { findUnique: jest.Mock; update: jest.Mock };
    medication: {
      update: jest.Mock;
      deleteMany: jest.Mock;
      findMany: jest.Mock;
    };
    scheduleSlot: { deleteMany: jest.Mock };
    doseEvent: {
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
    };
    refillRequest: { updateMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let extractor: { extract: jest.Mock };
  let events: { emit: jest.Mock };
  let service: PrescriptionsService;

  beforeEach(() => {
    prisma = {
      patient: { findUnique: jest.fn().mockResolvedValue({ id: 2 }) },
      prescription: { findUnique: jest.fn(), update: jest.fn() },
      medication: {
        // The confirmed medication comes back with its new intake slots
        update: jest.fn(
          (args: {
            where: { id: number };
            data: { slots?: { create: object[] } };
          }) => ({
            id: args.where.id,
            name: args.where.id === 7 ? 'Kardégic' : 'Metformin',
            strength: args.where.id === 7 ? '75 mg' : '500 mg',
            slots: (args.data.slots?.create ?? []).map((slot, index) => ({
              id: 100 + index,
              ...slot,
            })),
          }),
        ),
        deleteMany: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      scheduleSlot: { deleteMany: jest.fn() },
      doseEvent: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
      refillRequest: { updateMany: jest.fn() },
      $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
        fn(prisma),
      ),
    };
    extractor = { extract: jest.fn() };
    events = { emit: jest.fn() };
    service = new PrescriptionsService(
      prisma as unknown as PrismaService,
      events as unknown as CareEventsService,
      extractor as unknown as PrescriptionExtractor,
    );
  });

  describe('scan', () => {
    it('refuses a scan where no medication could be read', async () => {
      extractor.extract.mockResolvedValue({
        doctorName: 'Dr. Evans',
        medications: [],
      });

      await expect(service.scan(2, scan)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('refuses an unknown patient before calling the extractor', async () => {
      prisma.patient.findUnique.mockResolvedValue(null);

      await expect(service.scan(999, scan)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(extractor.extract).not.toHaveBeenCalled();
    });
  });

  describe('confirm', () => {
    it('activates the kept medications with their times and drops the removed one', async () => {
      prisma.prescription.findUnique.mockResolvedValue(draft());

      await service.confirm(3, {
        medications: [
          { id: 7, schedule: [{ timeOfDay: TimeOfDay.MORNING }] },
          {
            id: 8,
            schedule: [{ timeOfDay: TimeOfDay.MIDDAY, time: '13:15' }],
            stockDoses: 30,
          },
        ],
      });

      // 9 was removed during review
      expect(prisma.medication.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [9] } },
      });
      expect(prisma.medication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 7 },
          data: expect.objectContaining({
            isActive: true,
            slots: {
              create: [{ timeOfDay: TimeOfDay.MORNING, time: '08:00' }],
            },
          }),
        }),
      );
      expect(prisma.medication.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 8 },
          data: expect.objectContaining({
            stockDoses: 30,
            slots: { create: [{ timeOfDay: TimeOfDay.MIDDAY, time: '13:15' }] },
          }),
        }),
      );
      expect(prisma.prescription.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { status: PrescriptionStatus.ACTIVE },
      });
      expect(events.emit).toHaveBeenCalledWith(2, 'prescription');
    });

    it('replaces a medicine Jeanne already takes instead of adding it twice', async () => {
      jest.useFakeTimers({ now: new Date('2026-10-29T10:00:00Z') });
      prisma.prescription.findUnique.mockResolvedValue(draft());
      // Already on the schedule from an earlier prescription (different spacing/case)
      prisma.medication.findMany.mockResolvedValue([
        {
          id: 4,
          name: 'KARDÉGIC ',
          strength: '75 mg',
          stockDoses: 12,
          slots: [],
        },
        { id: 5, name: 'Tahor', strength: '20 mg', stockDoses: 4, slots: [] },
      ]);
      // Taken this morning on the old Kardégic, plus a pending evening dose
      prisma.doseEvent.findMany.mockResolvedValue([
        { id: 900, status: 'TAKEN', slot: { timeOfDay: TimeOfDay.MORNING } },
        { id: 901, status: 'PENDING', slot: { timeOfDay: TimeOfDay.EVENING } },
      ]);

      const result = await service.confirm(3, {
        medications: [{ id: 7, schedule: [{ timeOfDay: TimeOfDay.MORNING }] }],
      });

      expect(result.replacedMedications).toEqual([
        { id: 4, name: 'KARDÉGIC ' },
      ]);
      // This morning's dose now belongs to the renewed Kardégic: not asked twice
      expect(prisma.doseEvent.update).toHaveBeenCalledWith({
        where: { id: 900 },
        data: { slotId: 100, scheduledAt: new Date('2026-10-29T07:00:00Z') },
      });
      // No evening slot any more: the pending dose goes
      expect(prisma.doseEvent.delete).toHaveBeenCalledWith({
        where: { id: 901 },
      });
      // Pills at home carry over, planned refill follows, old one stops
      expect(prisma.medication.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { stockDoses: { increment: 12 } },
      });
      expect(prisma.refillRequest.updateMany).toHaveBeenCalledWith({
        where: { medicationId: 4, status: 'PLANNED' },
        data: { medicationId: 7 },
      });
      expect(prisma.medication.update).toHaveBeenCalledWith({
        where: { id: 4 },
        data: { isActive: false },
      });
      // Tahor is a different medicine: untouched
      expect(prisma.medication.update).not.toHaveBeenCalledWith({
        where: { id: 5 },
        data: { isActive: false },
      });
      jest.useRealTimers();
    });

    it('refuses a prescription that was already confirmed', async () => {
      prisma.prescription.findUnique.mockResolvedValue(
        draft(PrescriptionStatus.ACTIVE),
      );

      await expect(
        service.confirm(3, {
          medications: [
            { id: 7, schedule: [{ timeOfDay: TimeOfDay.MORNING }] },
          ],
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('refuses a medication from another prescription', async () => {
      prisma.prescription.findUnique.mockResolvedValue(draft());

      await expect(
        service.confirm(3, {
          medications: [
            { id: 4, schedule: [{ timeOfDay: TimeOfDay.MORNING }] },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });
});
