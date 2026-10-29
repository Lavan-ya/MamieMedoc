"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionsModule = void 0;
const common_1 = require("@nestjs/common");
const claude_prescription_extractor_1 = require("./extraction/claude-prescription-extractor");
const mock_prescription_extractor_1 = require("./extraction/mock-prescription-extractor");
const prescription_extractor_1 = require("./extraction/prescription-extractor");
const prescriptions_controller_1 = require("./prescriptions.controller");
const prescriptions_service_1 = require("./prescriptions.service");
let PrescriptionsModule = class PrescriptionsModule {
};
exports.PrescriptionsModule = PrescriptionsModule;
exports.PrescriptionsModule = PrescriptionsModule = __decorate([
    (0, common_1.Module)({
        controllers: [prescriptions_controller_1.PrescriptionsController],
        providers: [
            prescriptions_service_1.PrescriptionsService,
            {
                provide: prescription_extractor_1.PRESCRIPTION_EXTRACTOR,
                useFactory: () => process.env.PRESCRIPTION_EXTRACTOR === 'mock'
                    ? new mock_prescription_extractor_1.MockPrescriptionExtractor()
                    : new claude_prescription_extractor_1.ClaudePrescriptionExtractor(),
            },
        ],
    })
], PrescriptionsModule);
//# sourceMappingURL=prescriptions.module.js.map