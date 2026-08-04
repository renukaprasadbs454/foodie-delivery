import {
  formatDistanceKm,
  formatMoney,
  isTerminalOrderStatus,
  isUuid,
  normalizeOffers,
} from '../features/home/types';

describe('home types (P2-DEL-02)', () => {
  it('validates uuids and terminal statuses', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isTerminalOrderStatus('DELIVERED')).toBe(true);
    expect(isTerminalOrderStatus('OUT_FOR_DELIVERY')).toBe(false);
  });

  it('formats money and distance', () => {
    expect(formatMoney(12.5)).toBe('₹12.50');
    expect(formatDistanceKm(3.14159)).toBe('3.1 km');
  });

  it('normalizes offers arrays and page wrappers', () => {
    const offer = {
      assignmentId: 'a',
      orderId: 'o',
      restaurantName: 'R',
      pickupAddress: 'P',
      estimatedDistance: 1,
    };
    expect(normalizeOffers([offer])).toEqual([offer]);
    expect(normalizeOffers({ content: [offer] })).toEqual([offer]);
    expect(normalizeOffers(null)).toEqual([]);
  });
});
