import { Injectable } from '@nestjs/common';
import { TimeOfDay } from '@prisma/client';
import {
  ExtractedPrescription,
  PrescriptionExtractor,
  UploadedScan,
} from './prescription-extractor';

// Returns a fixed prescription so the whole review flow can be built and
// tested before the Claude extractor is plugged in.
@Injectable()
export class MockPrescriptionExtractor implements PrescriptionExtractor {
  extract(_scan: UploadedScan): Promise<ExtractedPrescription> {
    return Promise.resolve({
      doctorName: 'Dr. Arthur Evans',
      doctorSpecialty: 'Cardiology Dept.',
      issuedAt: new Date(),
      confidence: 98.4,
      medications: [
        {
          name: 'Kardégic',
          strength: '75 mg',
          activeIngredient: 'Acetylsalicylate de lysine',
          purpose: 'Blood thinner',
          form: 'Sachet',
          doseQuantity: 1,
          doseUnit: 'sachet',
          instruction: 'diluted in water',
          mealInstruction: 'After breakfast',
          stockDoses: 21,
          schedule: [TimeOfDay.MORNING],
        },
        {
          name: 'Metformin',
          strength: '500 mg',
          activeIngredient: 'Biguanide',
          purpose: 'Glycemic regulation',
          form: 'Tablet',
          doseQuantity: 1,
          doseUnit: 'tablet',
          instruction: 'with a glass of water',
          mealInstruction: 'With meal',
          stockDoses: 5,
          schedule: [TimeOfDay.MIDDAY],
        },
        {
          name: 'Doliprane',
          strength: '1000 mg',
          activeIngredient: 'Paracetamol',
          purpose: 'Pain & joint comfort',
          form: 'Effervescent tablet',
          doseQuantity: 1,
          doseUnit: 'tablet',
          instruction: 'dissolved in water, if pain persists',
          asNeeded: true,
          maxPerDay: 3,
          stockDoses: 16,
          schedule: [TimeOfDay.EVENING],
        },
      ],
    });
  }
}
