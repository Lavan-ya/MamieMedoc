"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CareEventsService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let CareEventsService = class CareEventsService {
    events = new rxjs_1.Subject();
    emit(patientId, type) {
        this.events.next({ patientId, type });
    }
    forPatient(patientId) {
        return this.events.pipe((0, rxjs_1.filter)((event) => event.patientId === patientId), (0, rxjs_1.map)((event) => event.type));
    }
};
exports.CareEventsService = CareEventsService;
exports.CareEventsService = CareEventsService = __decorate([
    (0, common_1.Injectable)()
], CareEventsService);
//# sourceMappingURL=care-events.service.js.map