export declare const LOW_STOCK_DOSES = 10;
export declare function isLowStock(medication: {
    stockDoses: number;
    lowStockAlert: boolean;
    lowStockThresholdDays: number;
    daysLeft: number | null;
}): boolean;
