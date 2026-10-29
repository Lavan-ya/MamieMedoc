import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { TimeOfDay } from '@prisma/client';
import { z } from 'zod';
import {
  ExtractedPrescription,
  PrescriptionExtractor,
  UploadedScan,
} from './prescription-extractor';

const MODEL = 'claude-opus-5-5';

const MedicationSchema = z.object({
  name: z
    .string()
    .describe('Brand or generic name exactly as printed, e.g. "Kardégic"'),
  strength: z.string().describe('e.g. "75 mg", "1000 mg", "3 drops"'),
  activeIngredient: z.string().nullable(),
  purpose: z
    .string()
    .nullable()
    .describe('Short therapeutic purpose in English, null if unsure'),
  form: z
    .string()
    .describe('e.g. "Tablet", "Sachet", "Effervescent tablet", "Drops"'),
  doseQuantity: z.number().describe('Units taken per intake, e.g. 1'),
  doseUnit: z
    .string()
    .describe('Singular unit, e.g. "tablet", "sachet", "drop"'),
  instruction: z
    .string()
    .describe('Short English instruction, e.g. "with a glass of water"'),
  mealInstruction: z
    .string()
    .nullable()
    .describe('e.g. "After breakfast", null if none'),
  asNeeded: z.boolean().describe('true for "si besoin" / "si douleur"'),
  maxPerDay: z.number().int().nullable(),
  stockDoses: z
    .number()
    .int()
    .nullable()
    .describe('Doses delivered only if a quantity is written, otherwise null'),
  schedule: z.array(z.enum(['MORNING', 'MIDDAY', 'EVENING', 'BEDTIME'])),
});

const PrescriptionSchema = z.object({
  isPrescription: z.boolean(),
  notPrescriptionReason: z
    .string()
    .nullable()
    .describe(
      'Only when isPrescription is false: what the document is instead, in a few words',
    ),
  doctorName: z.string().nullable(),
  doctorSpecialty: z.string().nullable(),
  clinicName: z.string().nullable(),
  clinicPhone: z.string().nullable(),
  pharmacyName: z.string().nullable(),
  issuedAt: z.string().nullable().describe('YYYY-MM-DD'),
  legibility: z
    .number()
    .int()
    .describe('0-100: how clearly the document could be read overall'),
  medications: z.array(MedicationSchema),
});

const SYSTEM_PROMPT = `You read medical prescriptions for MamieMedoc, an app that helps families manage an elderly parent's medication. A caregiver reviews everything you return before it reaches the patient's schedule, so accuracy matters more than completeness.

Prescriptions can come from any country and be in any language (French ordonnances, English, ...), printed or handwritten. Sample, specimen, template or demo prescriptions count as prescriptions: read them like real ones.

- Set isPrescription to false only when the document is clearly not a prescription (a photo of a person or object, a receipt, an unrelated letter), return no medications, and say what it is in notPrescriptionReason.
- Copy medication names and strengths exactly as written, without form prefixes such as "TAB." or "CAP." (put the form in the form field). If a name or dose is illegible, leave that medication out rather than guessing.
- Translate instructions to short, plain English.
- Intake times -> schedule, one entry per time the medicine is taken:
  - MORNING: "matin", morning, breakfast
  - MIDDAY: "midi", noon, lunch, afternoon, "Aft"
  - EVENING: "soir", evening, "Eve", dinner
  - BEDTIME: "coucher", night, bedtime
  - "1 Morning, 1 Night" -> MORNING and BEDTIME. "1 fois par jour" / once a day with no time -> MORNING; twice a day -> MORNING and EVENING; three times a day -> MORNING, MIDDAY and EVENING.
- doseQuantity is the amount per intake: "1/2" or "half" -> 0.5.
- stockDoses: the total quantity prescribed or delivered, when written (e.g. "Tot: 20 Tab" -> 20, "1 boîte de 30" -> 30); otherwise null.
- Before/after food or meals goes in mealInstruction ("Before meals", "After meals").
- For "si besoin" / "si douleur" / as needed, set asNeeded to true and keep any schedule that is written.`;

type ScanMediaType = 'image/jpeg' | 'image/png' | 'image/webp';

/** Reads the uploaded prescription with Claude (vision + PDF input, structured JSON output). */
@Injectable()
export class ClaudePrescriptionExtractor implements PrescriptionExtractor {
  private readonly logger = new Logger(ClaudePrescriptionExtractor.name);
  private client?: Anthropic;

  async extract(scan: UploadedScan): Promise<ExtractedPrescription> {
    const data = scan.buffer.toString('base64');
    const file: Anthropic.Beta.BetaContentBlockParam =
      scan.mimeType === 'application/pdf'
        ? {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data },
          }
        : {
            type: 'image',
            source: {
              type: 'base64',
              media_type: scan.mimeType as ScanMediaType,
              data,
            },
          };

    let response;
    try {
      response = await this.getClient().beta.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        // Re-runs the request on a fallback model if a safety classifier declines it.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: {
          effort: 'high',
          format: betaZodOutputFormat(PrescriptionSchema),
        },
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              file,
              { type: 'text', text: 'Extract this prescription.' },
            ],
          },
        ],
      });
    } catch (error) {
      throw this.toHttpError(error);
    }

    if (response.stop_reason === 'refusal') {
      throw new UnprocessableEntityException(
        'This document could not be read. Please upload a photo of the prescription only.',
      );
    }
    const result = response.parsed_output;
    if (response.stop_reason === 'max_tokens' || !result) {
      this.logger.error(
        `Unusable extraction (stop_reason=${response.stop_reason})`,
      );
      throw new BadGatewayException(
        'The prescription could not be read. Please try again.',
      );
    }
    // Only refuse when nothing usable was read: medicines found means a prescription.
    if (!result.isPrescription && result.medications.length === 0) {
      this.logger.warn(
        `Upload refused as not a prescription: ${result.notPrescriptionReason ?? 'no reason given'}`,
      );
      throw new UnprocessableEntityException(
        result.notPrescriptionReason
          ? `This does not look like a prescription (${result.notPrescriptionReason}). Please upload a photo of the prescription.`
          : 'This does not look like a prescription. Please upload a photo of the prescription.',
      );
    }

    const issuedAt = result.issuedAt ? new Date(result.issuedAt) : undefined;
    return {
      doctorName: result.doctorName ?? 'Unknown doctor',
      doctorSpecialty: result.doctorSpecialty ?? undefined,
      clinicName: result.clinicName ?? undefined,
      clinicPhone: result.clinicPhone ?? undefined,
      pharmacyName: result.pharmacyName ?? undefined,
      issuedAt: issuedAt && !isNaN(issuedAt.getTime()) ? issuedAt : undefined,
      confidence: result.legibility,
      medications: result.medications.map((medication) => ({
        ...medication,
        activeIngredient: medication.activeIngredient ?? undefined,
        purpose: medication.purpose ?? undefined,
        mealInstruction: medication.mealInstruction ?? undefined,
        maxPerDay: medication.maxPerDay ?? undefined,
        stockDoses: medication.stockDoses ?? undefined,
        schedule: [...new Set(medication.schedule)] as TimeOfDay[],
      })),
    };
  }

  private getClient() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new ServiceUnavailableException(
        'Prescription reading is not configured: add ANTHROPIC_API_KEY to api/.env and restart the API.',
      );
    }
    this.client ??= new Anthropic();
    return this.client;
  }

  private toHttpError(error: unknown) {
    if (error instanceof ServiceUnavailableException) return error;
    if (error instanceof Anthropic.AuthenticationError) {
      return new ServiceUnavailableException(
        'The Claude API key in api/.env was rejected. Check ANTHROPIC_API_KEY.',
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return new ServiceUnavailableException(
        'Too many prescriptions are being read right now. Please try again in a minute.',
      );
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return new ServiceUnavailableException(
        'Could not reach Claude. Check your internet connection.',
      );
    }
    if (error instanceof Anthropic.APIError) {
      this.logger.error(`Claude API error ${error.status}: ${error.message}`);
      return new BadGatewayException(
        'The prescription could not be read. Please try again.',
      );
    }
    return error;
  }
}
