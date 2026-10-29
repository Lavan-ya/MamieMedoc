// When home stock triggers a refill alert on the family dashboard.
export const LOW_STOCK_DOSES = 10;

/**
 * Low when 10 doses or fewer are left, or when the stock covers fewer days
 * than the medication's alert threshold (7 by default), so a medicine taken
 * three times a day is caught before it runs out. No alert when the caregiver
 * turned alerts off for that medication.
 */
export function isLowStock(medication: {
  stockDoses: number;
  lowStockAlert: boolean;
  lowStockThresholdDays: number;
  daysLeft: number | null;
}) {
  if (!medication.lowStockAlert) return false;
  if (medication.stockDoses <= LOW_STOCK_DOSES) return true;
  return (
    medication.daysLeft !== null &&
    medication.daysLeft <= medication.lowStockThresholdDays
  );
}
