import {
  DEFAULT_RESTAURANT_PAGE_SIZE,
  hasMoreRestaurantPages,
  isRestaurantId,
  isRestaurantSort,
  RESTAURANT_SORT_WHITELIST,
} from '../features/restaurants/types';

describe('P2-CUS-01 restaurant browse helpers', () => {
  it('accepts only UUID restaurant ids', () => {
    expect(isRestaurantId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isRestaurantId('not-a-uuid')).toBe(false);
    expect(isRestaurantId('')).toBe(false);
  });

  it('whitelists sort fields mirroring §3.1', () => {
    for (const sort of RESTAURANT_SORT_WHITELIST) {
      expect(isRestaurantSort(sort)).toBe(true);
    }
    expect(isRestaurantSort('commissionPct')).toBe(false);
    expect(isRestaurantSort('distance')).toBe(false);
  });

  it('detects end-of-list when page length is below size', () => {
    const full = Array.from({ length: DEFAULT_RESTAURANT_PAGE_SIZE }, (_, i) => ({
      id: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
      name: `R${i}`,
    }));
    expect(hasMoreRestaurantPages(full)).toBe(true);
    expect(hasMoreRestaurantPages(full.slice(0, 3))).toBe(false);
    expect(hasMoreRestaurantPages(undefined)).toBe(false);
  });
});
