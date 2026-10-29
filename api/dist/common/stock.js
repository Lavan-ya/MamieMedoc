"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LOW_STOCK_DOSES = void 0;
exports.isLowStock = isLowStock;
exports.LOW_STOCK_DOSES = 10;
function isLowStock(medication) {
    if (!medication.lowStockAlert)
        return false;
    if (medication.stockDoses <= exports.LOW_STOCK_DOSES)
        return true;
    return (medication.daysLeft !== null &&
        medication.daysLeft <= medication.lowStockThresholdDays);
}
//# sourceMappingURL=stock.js.map