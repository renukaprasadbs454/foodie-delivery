import {
  defaultDateRange,
  formatMoneyInr,
  formatPercent,
  isIsoDate,
  validateDateRange,
} from '../features/analytics/types';

describe('P2-ADM-02 analytics helpers', () => {
  it('validates ISO date range', () => {
    expect(isIsoDate('2026-08-03')).toBe(true);
    expect(isIsoDate('08/03/2026')).toBe(false);
    expect(validateDateRange('2026-08-01', '2026-08-03').ok).toBe(true);
    expect(validateDateRange('2026-08-03', '2026-08-01').ok).toBe(false);
    expect(validateDateRange('', '2026-08-01').ok).toBe(false);
  });

  it('defaults to a 7-day inclusive UTC window', () => {
    const range = defaultDateRange(new Date('2026-08-03T12:00:00.000Z'));
    expect(range.dateTo).toBe('2026-08-03');
    expect(range.dateFrom).toBe('2026-07-28');
  });

  it('formats INR money and percents to 2dp', () => {
    expect(formatMoneyInr(12.5)).toBe('₹12.50');
    expect(formatPercent('33.333')).toBe('33.33%');
  });
});
