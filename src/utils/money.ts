/**
 * Money display helpers — 04_API_Contracts.md Money Format (INR, 2 decimals).
 */
const INR_FORMATTER = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format a contract money number for display. Never use float stringification. */
export function formatMoneyInr(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new Error('formatMoneyInr: amount must be a finite number');
  }
  return INR_FORMATTER.format(amount);
}

/** Round to exactly 2 decimal places (display/math helper; API remains source of truth). */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
