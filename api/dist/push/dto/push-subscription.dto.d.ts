declare class PushKeysDto {
    p256dh: string;
    auth: string;
}
export declare class PushSubscriptionDto {
    endpoint: string;
    keys: PushKeysDto;
}
export declare class RemovePushSubscriptionDto {
    endpoint: string;
}
export {};
