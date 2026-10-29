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
exports.PushController = void 0;
const common_1 = require("@nestjs/common");
const push_subscription_dto_1 = require("./dto/push-subscription.dto");
const push_service_1 = require("./push.service");
let PushController = class PushController {
    push;
    constructor(push) {
        this.push = push;
    }
    publicKey() {
        return { publicKey: this.push.getPublicKey() };
    }
    subscribe(patientId, dto) {
        return this.push
            .subscribe(patientId, dto)
            .then((subscription) => ({ id: subscription.id }));
    }
    async test(patientId) {
        const sent = await this.push.sendToPatient(patientId, {
            doseId: 0,
            title: 'Test reminder',
            body: 'Reminders are working on this tablet.',
            snoozesLeft: 0,
        });
        return { sent };
    }
    unsubscribe(dto) {
        return this.push.unsubscribe(dto.endpoint);
    }
};
exports.PushController = PushController;
__decorate([
    (0, common_1.Get)('push/public-key'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PushController.prototype, "publicKey", null);
__decorate([
    (0, common_1.Post)('patients/:patientId/push-subscriptions'),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, push_subscription_dto_1.PushSubscriptionDto]),
    __metadata("design:returntype", void 0)
], PushController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Post)('patients/:patientId/push-test'),
    __param(0, (0, common_1.Param)('patientId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PushController.prototype, "test", null);
__decorate([
    (0, common_1.Delete)('push-subscriptions'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [push_subscription_dto_1.RemovePushSubscriptionDto]),
    __metadata("design:returntype", void 0)
], PushController.prototype, "unsubscribe", null);
exports.PushController = PushController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [push_service_1.PushService])
], PushController);
//# sourceMappingURL=push.controller.js.map