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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const confirm_prescription_dto_1 = require("./dto/confirm-prescription.dto");
const list_prescriptions_query_1 = require("./dto/list-prescriptions.query");
const prescriptions_service_1 = require("./prescriptions.service");
const ACCEPTED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
];
const MAX_SCAN_BYTES = 10 * 1024 * 1024;
let PrescriptionsController = class PrescriptionsController {
    prescriptions;
    constructor(prescriptions) {
        this.prescriptions = prescriptions;
    }
    scan(file, body) {
        if (!file)
            throw new common_1.BadRequestException('A prescription file is required');
        return this.prescriptions.scan(body.patientId, {
            buffer: file.buffer,
            mimeType: file.mimetype,
            originalName: file.originalname,
        });
    }
    list(query) {
        return this.prescriptions.list(query.patientId, query.status);
    }
    findOne(id) {
        return this.prescriptions.findOne(id);
    }
    confirm(id, dto) {
        return this.prescriptions.confirm(id, dto);
    }
    discard(id) {
        return this.prescriptions.discard(id);
    }
};
exports.PrescriptionsController = PrescriptionsController;
__decorate([
    (0, common_1.Post)('scan'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: MAX_SCAN_BYTES },
        fileFilter: (_req, file, accept) => {
            if (ACCEPTED_TYPES.includes(file.mimetype))
                return accept(null, true);
            accept(new common_1.BadRequestException('Upload a JPG, PNG, WEBP or PDF prescription'), false);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, list_prescriptions_query_1.ScanPrescriptionBody]),
    __metadata("design:returntype", void 0)
], PrescriptionsController.prototype, "scan", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_prescriptions_query_1.ListPrescriptionsQuery]),
    __metadata("design:returntype", void 0)
], PrescriptionsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PrescriptionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, confirm_prescription_dto_1.ConfirmPrescriptionDto]),
    __metadata("design:returntype", void 0)
], PrescriptionsController.prototype, "confirm", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PrescriptionsController.prototype, "discard", null);
exports.PrescriptionsController = PrescriptionsController = __decorate([
    (0, common_1.Controller)('prescriptions'),
    __metadata("design:paramtypes", [prescriptions_service_1.PrescriptionsService])
], PrescriptionsController);
//# sourceMappingURL=prescriptions.controller.js.map