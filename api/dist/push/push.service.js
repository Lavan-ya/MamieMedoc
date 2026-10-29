"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PushService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushService = void 0;
const common_1 = require("@nestjs/common");
const web_push_1 = __importStar(require("web-push"));
const prisma_service_1 = require("../prisma/prisma.service");
let PushService = PushService_1 = class PushService {
    prisma;
    logger = new common_1.Logger(PushService_1.name);
    publicKey = null;
    constructor(prisma) {
        this.prisma = prisma;
    }
    onModuleInit() {
        const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
        if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
            this.logger.warn('VAPID_* keys missing in api/.env: push reminders are disabled.');
            return;
        }
        web_push_1.default.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
        this.publicKey = VAPID_PUBLIC_KEY;
    }
    get enabled() {
        return this.publicKey !== null;
    }
    getPublicKey() {
        return this.publicKey;
    }
    subscribe(patientId, subscription) {
        const data = {
            patientId,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
        };
        return this.prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            create: { endpoint: subscription.endpoint, ...data },
            update: data,
        });
    }
    async unsubscribe(endpoint) {
        await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
    }
    async sendToPatient(patientId, payload) {
        if (!this.enabled)
            return 0;
        const subscriptions = await this.prisma.pushSubscription.findMany({
            where: { patientId },
        });
        const results = await Promise.all(subscriptions.map(async (subscription) => {
            try {
                await web_push_1.default.sendNotification({
                    endpoint: subscription.endpoint,
                    keys: { p256dh: subscription.p256dh, auth: subscription.auth },
                }, JSON.stringify(payload), { TTL: 30 * 60, urgency: 'high' });
                return true;
            }
            catch (error) {
                if (error instanceof web_push_1.WebPushError &&
                    [404, 410].includes(error.statusCode)) {
                    await this.unsubscribe(subscription.endpoint);
                }
                else {
                    this.logger.error(`Push to device ${subscription.id} failed: ${error.message}`);
                }
                return false;
            }
        }));
        return results.filter(Boolean).length;
    }
};
exports.PushService = PushService;
exports.PushService = PushService = PushService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PushService);
//# sourceMappingURL=push.service.js.map