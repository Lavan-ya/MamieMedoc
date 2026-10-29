"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareCircleModule = void 0;
const common_1 = require("@nestjs/common");
const care_circle_controller_1 = require("./care-circle.controller");
const care_circle_service_1 = require("./care-circle.service");
let CareCircleModule = class CareCircleModule {
};
exports.CareCircleModule = CareCircleModule;
exports.CareCircleModule = CareCircleModule = __decorate([
    (0, common_1.Module)({
        controllers: [care_circle_controller_1.CareCircleController],
        providers: [care_circle_service_1.CareCircleService],
        exports: [care_circle_service_1.CareCircleService],
    })
], CareCircleModule);
//# sourceMappingURL=care-circle.module.js.map