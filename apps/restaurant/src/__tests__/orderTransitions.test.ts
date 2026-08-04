import {
  isOrderId,
  isOrderSort,
  restaurantActionsForStatus,
  validateRejectReason,
} from '../features/orders/types';

describe('restaurant order transitions (P2-RES-02)', () => {
  it('exposes ACCEPTED/REJECTED from CONFIRMED', () => {
    expect(restaurantActionsForStatus('CONFIRMED')).toEqual([
      'ACCEPTED',
      'REJECTED',
    ]);
  });

  it('advances ACCEPTED → PREPARING → READY_FOR_PICKUP', () => {
    expect(restaurantActionsForStatus('ACCEPTED')).toEqual(['PREPARING']);
    expect(restaurantActionsForStatus('PREPARING')).toEqual([
      'READY_FOR_PICKUP',
    ]);
    expect(restaurantActionsForStatus('READY_FOR_PICKUP')).toEqual([]);
  });

  it('requires reject reason ≤500', () => {
    expect(validateRejectReason('').ok).toBe(false);
    expect(validateRejectReason('Out of stock').ok).toBe(true);
    expect(validateRejectReason('x'.repeat(501)).ok).toBe(false);
  });

  it('whitelists placedAt sort only', () => {
    expect(isOrderSort('placedAt')).toBe(true);
    expect(isOrderSort('totalAmount')).toBe(false);
  });

  it('validates order UUID', () => {
    expect(isOrderId('not-a-uuid')).toBe(false);
    expect(isOrderId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });
});
