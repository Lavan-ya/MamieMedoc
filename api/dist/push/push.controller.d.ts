import { PushSubscriptionDto, RemovePushSubscriptionDto } from './dto/push-subscription.dto';
import { PushService } from './push.service';
export declare class PushController {
    private readonly push;
    constructor(push: PushService);
    publicKey(): {
        publicKey: string | null;
    };
    subscribe(patientId: number, dto: PushSubscriptionDto): Promise<{
        id: number;
    }>;
    test(patientId: number): Promise<{
        sent: number;
    }>;
    unsubscribe(dto: RemovePushSubscriptionDto): Promise<void>;
}
