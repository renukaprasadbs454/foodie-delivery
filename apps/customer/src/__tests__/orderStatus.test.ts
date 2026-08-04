import {
  canCustomerCancelOrder,
  hasMoreOrderPages,
  isOrderSort,
  isTerminalOrderStatus,
  validateCancelReason,
} from '../features/orders/types';

describe('P2-CUS-06 order status helpers', () => {
  it('detects terminal statuses', () => {
    expect(isTerminalOrderStatus('DELIVERED')).toBe(true);
    expect(isTerminalOrderStatus('CANCELLED')).toBe(true);
    expect(isTerminalOrderStatus('REJECTED')).toBe(true);
    expect(isTerminalOrderStatus('PREPARING')).toBe(false);
  });

  it('allows customer cancel only pre-PREPARING', () => {
    expect(canCustomerCancelOrder('PLACED')).toBe(true);
    expect(canCustomerCancelOrder('CONFIRMED')).toBe(true);
    expect(canCustomerCancelOrder('ACCEPTED')).toBe(true);
    expect(canCustomerCancelOrder('PREPARING')).toBe(false);
    expect(canCustomerCancelOrder('OUT_FOR_DELIVERY')).toBe(false);
  });

  it('whitelists sort fields', () => {
    expect(isOrderSort('placedAt')).toBe(true);
    expect(isOrderSort('totalAmount')).toBe(true);
    expect(isOrderSort('createdAt')).toBe(false);
  });

  it('requires cancel reason', () => {
    expect(validateCancelReason('').ok).toBe(false);
    expect(validateCancelReason('  changed mind  ').ok).toBe(true);
  });

  it('detects more pages by page length', () => {
    expect(hasMoreOrderPages(new Array(20).fill({}), 20)).toBe(true);
    expect(hasMoreOrderPages(new Array(3).fill({}), 20)).toBe(false);
  });
});
