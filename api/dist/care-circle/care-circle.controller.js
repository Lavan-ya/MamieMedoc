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
exports.CareCircleController = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const care_events_service_1 = require("../events/care-events.service");
const care_circle_service_1 = require("./care-circle.service");
const care_circle_dto_1 = require("./dto/care-circle.dto");
const HEARTBEAT_MS = 25_000;
let CareCircleController = class CareCircleController {
    careCircle;
    events;
    constructor(careCircle, events) {
        this.careCircle = careCircle;
        this.events = events;
    }
    familyDashboard(patientId, query) {
        return this.careCircle.familyDashboard(patientId, query.days ?? 7);
    }
    today(patientId) {
        return this.careCircle.today(patientId);
    }
    stock(patientId) {
        return this.careCircle.stock(patientId);
    }
    adherence(patientId, query) {
        return this.careCircle.adherence(patientId, query.days ?? 7);
    }
    garden(patientId, query) {
        return this.careCircle.garden(patientId, query.weeks ?? 12);
    }
    planRefill(patientId, dto) {
        return this.careCircle.planRefill(patientId, dto.medicationId, dto.familyMemberId, dto.plannedFor);
    }
    completeRefill(patientId, refillId, dto) {
        return this.careCircle.completeRefill(patientId, refillId, dto.doses);
    }
    stream(patientId) {
        return (0, rxjs_1.merge)(this.events
            .forPatient(patientId)
            .pipe((0, rxjs_1.map)((type) => ({ data: { type } }))), (0, rxjs_1.interval)(HEARTBEAT_MS).pipe((0, rxjs_1.map)(() => ({ comment: 'heartbeat' }))));
    }
};
exports.CareCircleController = CareCircleController;
__decorate([
    (0, common_1.Get)('family-dashboard'),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, care_circle_dto_1.AdherenceQuery]),
    __metadata("design:returntype", void 0)
], CareCircleController.prototype, "familyDashboard", null);
__decorate([
    (0, common_1.Get)('care-circle/today'),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CareCircleController.prototype, "today", null);
__decorate([
    (0, common_1.Get)('stock'),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], CareCircleController.prototype, "stock", null);
__decorate([
    (0, common_1.Get)('adherence'),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, care_circle_dto_1.AdherenceQuery]),
    __metadata("design:returntype", void 0)
], CareCircleController.prototype, "adherence", null);
__decorate([
    (0, common_1.Get)('garden'),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, care_circle_dto_1.GardenQuery]),
    __metadata("design:returntype", void 0)
], CareCircleController.prototype, "garden", null);
__decorate([
    (0, common_1.Post)('refills'),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, care_circle_dto_1.PlanRefillDto]),
    __metadata("design:returntype", void 0)
], CareCircleController.prototype, "planRefill", null);
__decorate([
    (0, common_1.Post)('refills/:refillId/picked-up'),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('refillId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, care_circle_dto_1.CompleteRefillDto]),
    __metadata("design:returntype", void 0)
], CareCircleController.prototype, "completeRefill", null);
__decorate([
    (0, common_1.Sse)('events'),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", rxjs_1.Observable)
], CareCircleController.prototype, "stream", null);
exports.CareCircleController = CareCircleController = __decorate([
    (0, common_1.Controller)('patients/:patientId'),
    __metadata("design:paramtypes", [care_circle_service_1.CareCircleService,
        care_events_service_1.CareEventsService])
], CareCircleController);
//# sourceMappingURL=care-circle.controller.js.map