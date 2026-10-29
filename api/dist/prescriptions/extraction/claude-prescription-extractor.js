"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ClaudePrescriptionExtractor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudePrescriptionExtractor = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const zod_1 = require("@anthropic-ai/sdk/helpers/beta/zod");
const common_1 = require("@nestjs/common");
const zod_2 = require("zod");
const MODEL = 'claude-opus-5-5';
const MedicationSchema = zod_2.z.object({
    name: zod_2.z
        .string()
        .describe('Brand or generic name exactly as printed, e.g. "Kardégic"'),
    strength: zod_2.z.string().describe('e.g. "75 mg", "1000 mg", "3 drops"'),
    activeIngredient: zod_2.z.string().nullable(),
    purpose: zod_2.z
        .string()
        .nullable()
        .describe('Short therapeutic purpose in English, null if unsure'),
    form: zod_2.z
        .string()
        .describe('e.g. "Tablet", "Sachet", "Effervescent tablet", "Drops"'),
    doseQuantity: zod_2.z.number().describe('Units taken per intake, e.g. 1'),
    doseUnit: zod_2.z
        .string()
        .describe('Singular unit, e.g. "tablet", "sachet", "drop"'),
    instruction: zod_2.z
        .string()
        .describe('Short English instruction, e.g. "with a glass of water"'),
    mealInstruction: zod_2.z
        .string()
        .nullable()
        .describe('e.g. "After breakfast", null if none'),
    asNeeded: zod_2.z.boolean().describe('true for "si besoin" / "si douleur"'),
    maxPerDay: zod_2.z.number().int().nullable(),
    stockDoses: zod_2.z
        .number()
        .int()
        .nullable()
        .describe('Doses delivered only if a quantity is written, otherwise null'),
    schedule: zod_2.z.array(zod_2.z.enum(['MORNING', 'MIDDAY', 'EVENING', 'BEDTIME'])),
});
const PrescriptionSchema = zod_2.z.object({
    isPrescription: zod_2.z.boolean(),
    notPrescriptionReason: zod_2.z
        .string()
        .nullable()
        .describe('Only when isPrescription is false: what the document is instead, in a few words'),
    doctorName: zod_2.z.string().nullable(),
    doctorSpecialty: zod_2.z.string().nullable(),
    clinicName: zod_2.z.string().nullable(),
    clinicPhone: zod_2.z.string().nullable(),
    pharmacyName: zod_2.z.string().nullable(),
    issuedAt: zod_2.z.string().nullable().describe('YYYY-MM-DD'),
    legibility: zod_2.z
        .number()
        .int()
        .describe('0-100: how clearly the document could be read overall'),
    medications: zod_2.z.array(MedicationSchema),
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
let ClaudePrescriptionExtractor = ClaudePrescriptionExtractor_1 = class ClaudePrescriptionExtractor {
    logger = new common_1.Logger(ClaudePrescriptionExtractor_1.name);
    client;
    async extract(scan) {
        const data = scan.buffer.toString('base64');
        const file = scan.mimeType === 'application/pdf'
            ? {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data },
            }
            : {
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: scan.mimeType,
                    data,
                },
            };
        let response;
        try {
            response = await this.getClient().beta.messages.parse({
                model: MODEL,
                max_tokens: 16000,
                betas: ['server-side-fallback-2026-07-01'],
                fallbacks: 'default',
                output_config: {
                    effort: 'high',
                    format: (0, zod_1.betaZodOutputFormat)(PrescriptionSchema),
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
        }
        catch (error) {
            throw this.toHttpError(error);
        }
        if (response.stop_reason === 'refusal') {
            throw new common_1.UnprocessableEntityException('This document could not be read. Please upload a photo of the prescription only.');
        }
        const result = response.parsed_output;
        if (response.stop_reason === 'max_tokens' || !result) {
            this.logger.error(`Unusable extraction (stop_reason=${response.stop_reason})`);
            throw new common_1.BadGatewayException('The prescription could not be read. Please try again.');
        }
        if (!result.isPrescription && result.medications.length === 0) {
            this.logger.warn(`Upload refused as not a prescription: ${result.notPrescriptionReason ?? 'no reason given'}`);
            throw new common_1.UnprocessableEntityException(result.notPrescriptionReason
                ? `This does not look like a prescription (${result.notPrescriptionReason}). Please upload a photo of the prescription.`
                : 'This does not look like a prescription. Please upload a photo of the prescription.');
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
                schedule: [...new Set(medication.schedule)],
            })),
        };
    }
    getClient() {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new common_1.ServiceUnavailableException('Prescription reading is not configured: add ANTHROPIC_API_KEY to api/.env and restart the API.');
        }
        this.client ??= new sdk_1.default();
        return this.client;
    }
    toHttpError(error) {
        if (error instanceof common_1.ServiceUnavailableException)
            return error;
        if (error instanceof sdk_1.default.AuthenticationError) {
            return new common_1.ServiceUnavailableException('The Claude API key in api/.env was rejected. Check ANTHROPIC_API_KEY.');
        }
        if (error instanceof sdk_1.default.RateLimitError) {
            return new common_1.ServiceUnavailableException('Too many prescriptions are being read right now. Please try again in a minute.');
        }
        if (error instanceof sdk_1.default.APIConnectionError) {
            return new common_1.ServiceUnavailableException('Could not reach Claude. Check your internet connection.');
        }
        if (error instanceof sdk_1.default.APIError) {
            this.logger.error(`Claude API error ${error.status}: ${error.message}`);
            return new common_1.BadGatewayException('The prescription could not be read. Please try again.');
        }
        return error;
    }
};
exports.ClaudePrescriptionExtractor = ClaudePrescriptionExtractor;
exports.ClaudePrescriptionExtractor = ClaudePrescriptionExtractor = ClaudePrescriptionExtractor_1 = __decorate([
    (0, common_1.Injectable)()
], ClaudePrescriptionExtractor);
//# sourceMappingURL=claude-prescription-extractor.js.map