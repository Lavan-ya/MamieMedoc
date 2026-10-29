"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmPrescriptionDto = exports.ConfirmedMedicationDto = exports.ConfirmedSlotDto = void 0;
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class ConfirmedSlotDto {
    timeOfDay;
    time;
}
exports.ConfirmedSlotDto = ConfirmedSlotDto;
__decorate([
    (0, class_validator_1.IsEnum)(client_1.TimeOfDay),
    __metadata("design:type", String)
], ConfirmedSlotDto.prototype, "timeOfDay", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time must be HH:MM' }),
    __metadata("design:type", String)
], ConfirmedSlotDto.prototype, "time", void 0);
class ConfirmedMedicationDto {
    id;
    schedule;
    stockDoses;
    lowStockAlert;
    lowStockThresholdDays;
}
exports.ConfirmedMedicationDto = ConfirmedMedicationDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], ConfirmedMedicationDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1, { message: 'choose at least one intake time' }),
    (0, class_validator_1.ArrayUnique)((slot) => slot.timeOfDay),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ConfirmedSlotDto),
    __metadata("design:type", Array)
], ConfirmedMedicationDto.prototype, "schedule", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ConfirmedMedicationDto.prototype, "stockDoses", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ConfirmedMedicationDto.prototype, "lowStockAlert", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ConfirmedMedicationDto.prototype, "lowStockThresholdDays", void 0);
class ConfirmPrescriptionDto {
    medications;
}
exports.ConfirmPrescriptionDto = ConfirmPrescriptionDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ConfirmedMedicationDto),
    __metadata("design:type", Array)
], ConfirmPrescriptionDto.prototype, "medications", void 0);
//# sourceMappingURL=confirm-prescription.dto.js.map