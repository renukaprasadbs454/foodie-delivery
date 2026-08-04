import { formatMoneyInr, roundMoney } from '../utils/money';

describe('money utils', () => {
  it('formats INR with exactly 2 decimal places', () => {
    expect(formatMoneyInr(458.5)).toContain('458.50');
  });

  it('rounds money to 2 decimals', () => {
    expect(roundMoney(1.005)).toBeCloseTo(1.01, 2);
  });

  it('rejects non-finite amounts', () => {
    expect(() => formatMoneyInr(Number.NaN)).toThrow();
  });
});
