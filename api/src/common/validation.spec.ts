// Nest loads this at startup; the DTO decorators need it.
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import {
  CompleteRefillDto,
  PlanRefillDto,
} from '../care-circle/dto/care-circle.dto';
import { UpdateMedicationDto } from '../medications/dto/update-medication.dto';
import { ConfirmPrescriptionDto } from '../prescriptions/dto/confirm-prescription.dto';

// What the global ValidationPipe accepts or rejects (main.ts).
async function errors<T extends object>(type: new () => T, body: object) {
  const result = await validate(plainToInstance(type, body), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return messages(result);
}

/** Every message, however deeply nested (medications.0.schedule.1.time). */
function messages(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...messages(error.children ?? []),
  ]);
}

describe('request validation', () => {
  describe('confirming a prescription', () => {
    it('accepts intake slots with and without a custom time', async () => {
      await expect(
        errors(ConfirmPrescriptionDto, {
          medications: [
            {
              id: 7,
              schedule: [
                { timeOfDay: 'MORNING' },
                { timeOfDay: 'EVENING', time: '19:45' },
              ],
            },
          ],
        }),
      ).resolves.toEqual([]);
    });

    it('requires at least one intake time per medication', async () => {
      const result = await errors(ConfirmPrescriptionDto, {
        medications: [{ id: 7, schedule: [] }],
      });
      expect(result).toContain('choose at least one intake time');
    });

    it('rejects an invalid time and a duplicated slot', async () => {
      const result = await errors(ConfirmPrescriptionDto, {
        medications: [
          {
            id: 7,
            schedule: [
              { timeOfDay: 'MORNING', time: '25:00' },
              { timeOfDay: 'MORNING' },
            ],
          },
        ],
      });
      expect(result.join(' ')).toMatch(/HH:MM/);
      expect(result.join(' ')).toMatch(/unique/);
    });
  });

  describe('editing a current medication', () => {
    it('rejects an empty schedule (stop the medication instead)', async () => {
      await expect(
        errors(UpdateMedicationDto, { schedule: [] }),
      ).resolves.toContain('choose at least one intake time');
    });

    it('rejects negative stock', async () => {
      const result = await errors(UpdateMedicationDto, { stockDoses: -1 });
      expect(result).toHaveLength(1);
    });
  });

  describe('refills', () => {
    it('requires a positive box size when picking up', async () => {
      await expect(errors(CompleteRefillDto, { doses: 30 })).resolves.toEqual(
        [],
      );
      await expect(
        errors(CompleteRefillDto, { doses: 0 }),
      ).resolves.toHaveLength(1);
    });

    it('requires a pickup time when planning', async () => {
      const result = await errors(PlanRefillDto, {
        medicationId: 36,
        familyMemberId: 4,
        plannedFor: '',
      });
      expect(result).toHaveLength(1);
    });

    it('rejects unexpected fields', async () => {
      const result = await errors(CompleteRefillDto, {
        doses: 30,
        isAdmin: true,
      });
      expect(result.join(' ')).toMatch(/should not exist/);
    });
  });
});
