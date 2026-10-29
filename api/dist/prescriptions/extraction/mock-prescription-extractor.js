"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockPrescriptionExtractor = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let MockPrescriptionExtractor = class MockPrescriptionExtractor {
    extract(_scan) {
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
                    schedule: [client_1.TimeOfDay.MORNING],
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
                    schedule: [client_1.TimeOfDay.MIDDAY],
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
                    schedule: [client_1.TimeOfDay.EVENING],
                },
            ],
        });
    }
};
exports.MockPrescriptionExtractor = MockPrescriptionExtractor;
exports.MockPrescriptionExtractor = MockPrescriptionExtractor = __decorate([
    (0, common_1.Injectable)()
], MockPrescriptionExtractor);
//# sourceMappingURL=mock-prescription-extractor.js.map