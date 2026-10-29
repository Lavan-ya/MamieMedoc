import webpush, { WebPushError } from 'web-push';
import { PrismaService } from '../prisma/prisma.service';
import { PushService } from './push.service';

jest.mock('web-push', () => {
  class WebPushError extends Error {
    constructor(
      message: string,
      readonly statusCode: number,
    ) {
      super(message);
    }
  }
  const api = {
    setVapidDetails: jest.fn(),
    sendNotification: jest.fn(),
    WebPushError,
  };
  return { __esModule: true, default: api, ...api };
});

const send = webpush.sendNotification as jest.Mock;
const payload = { doseId: 7, title: 'Time', body: 'Metformin', snoozesLeft: 3 };

describe('PushService', () => {
  let prisma: {
    pushSubscription: { findMany: jest.Mock; deleteMany: jest.Mock };
  };
  let service: PushService;

  beforeEach(() => {
    send.mockReset();
    process.env.VAPID_PUBLIC_KEY = 'public';
    process.env.VAPID_PRIVATE_KEY = 'private';
    process.env.VAPID_SUBJECT = 'mailto:test@example.com';
    prisma = {
      pushSubscription: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, endpoint: 'https://push/tablet', p256dh: 'k', auth: 'a' },
          { id: 2, endpoint: 'https://push/old-phone', p256dh: 'k', auth: 'a' },
        ]),
        deleteMany: jest.fn(),
      },
    };
    service = new PushService(prisma as unknown as PrismaService);
    service.onModuleInit();
  });

  it("sends to every one of the patient's devices", async () => {
    send.mockResolvedValue({});

    await expect(service.sendToPatient(2, payload)).resolves.toBe(2);
    expect(send).toHaveBeenCalledWith(
      { endpoint: 'https://push/tablet', keys: { p256dh: 'k', auth: 'a' } },
      JSON.stringify(payload),
      { TTL: 1800, urgency: 'high' },
    );
  });

  it('forgets a device the push service no longer knows (410 Gone)', async () => {
    send
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new WebPushError('Gone', 410, {}, '', ''));

    await expect(service.sendToPatient(2, payload)).resolves.toBe(1);
    expect(prisma.pushSubscription.deleteMany).toHaveBeenCalledWith({
      where: { endpoint: 'https://push/old-phone' },
    });
  });

  it('keeps a device after a temporary failure', async () => {
    send.mockRejectedValue(new Error('network down'));

    await expect(service.sendToPatient(2, payload)).resolves.toBe(0);
    expect(prisma.pushSubscription.deleteMany).not.toHaveBeenCalled();
  });

  it('is disabled without VAPID keys', async () => {
    delete process.env.VAPID_PRIVATE_KEY;
    const disabled = new PushService(prisma as unknown as PrismaService);
    disabled.onModuleInit();

    expect(disabled.enabled).toBe(false);
    await expect(disabled.sendToPatient(2, payload)).resolves.toBe(0);
    expect(send).not.toHaveBeenCalled();
  });
});
