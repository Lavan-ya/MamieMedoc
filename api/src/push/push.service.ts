import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import webpush, { WebPushError } from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

export interface ReminderPayload {
  doseId: number;
  title: string;
  body: string;
  /** 0 = last reminder: the notification offers no snooze. */
  snoozesLeft: number;
}

/** Web Push to the patient's devices (VAPID keys in api/.env). */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private publicKey: string | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
      this.logger.warn(
        'VAPID_* keys missing in api/.env: push reminders are disabled.',
      );
      return;
    }
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    this.publicKey = VAPID_PUBLIC_KEY;
  }

  get enabled() {
    return this.publicKey !== null;
  }

  getPublicKey() {
    return this.publicKey;
  }

  /** Saves (or re-assigns) a device; the same browser always has one endpoint. */
  subscribe(patientId: number, subscription: PushSubscriptionDto) {
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

  async unsubscribe(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } });
  }

  /** Sends to every device of the patient; returns how many received it. */
  async sendToPatient(patientId: number, payload: ReminderPayload) {
    if (!this.enabled) return 0;
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { patientId },
    });

    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            JSON.stringify(payload),
            // Undelivered reminders are useless after 30 minutes.
            { TTL: 30 * 60, urgency: 'high' },
          );
          return true;
        } catch (error) {
          // 404/410: the browser unsubscribed or the app was removed.
          if (
            error instanceof WebPushError &&
            [404, 410].includes(error.statusCode)
          ) {
            await this.unsubscribe(subscription.endpoint);
          } else {
            this.logger.error(
              `Push to device ${subscription.id} failed: ${(error as Error).message}`,
            );
          }
          return false;
        }
      }),
    );
    return results.filter(Boolean).length;
  }
}
