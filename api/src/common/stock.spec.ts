import { isLowStock, LOW_STOCK_DOSES } from './stock';

const medication = {
  stockDoses: 30,
  lowStockAlert: true,
  lowStockThresholdDays: 7,
  daysLeft: 30,
};

describe('isLowStock (family refill alert)', () => {
  it('alerts at 10 doses or fewer', () => {
    expect(LOW_STOCK_DOSES).toBe(10);
    expect(isLowStock({ ...medication, stockDoses: 11, daysLeft: 11 })).toBe(
      false,
    );
    expect(isLowStock({ ...medication, stockDoses: 10, daysLeft: 10 })).toBe(
      true,
    );
    expect(isLowStock({ ...medication, stockDoses: 0, daysLeft: 0 })).toBe(
      true,
    );
  });

  it('also alerts when a frequent medicine has a week or less left', () => {
    // 3 a day: 18 doses = 6 days
    expect(isLowStock({ ...medication, stockDoses: 18, daysLeft: 6 })).toBe(
      true,
    );
  });

  it('stays quiet when alerts are turned off for the medication', () => {
    expect(
      isLowStock({
        ...medication,
        stockDoses: 2,
        daysLeft: 2,
        lowStockAlert: false,
      }),
    ).toBe(false);
  });

  it('handles as-needed medicines with no daily schedule', () => {
    expect(isLowStock({ ...medication, stockDoses: 20, daysLeft: null })).toBe(
      false,
    );
    expect(isLowStock({ ...medication, stockDoses: 5, daysLeft: null })).toBe(
      true,
    );
  });
});
