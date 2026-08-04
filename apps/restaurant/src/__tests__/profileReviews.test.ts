import { validateProfileForm } from '../features/profile/types';
import { isReviewSort } from '../features/reviews/types';

describe('profile + reviews helpers (P2-RES-04)', () => {
  it('validates profile PUT payload without commission', () => {
    const result = validateProfileForm({
      name: 'Spice Hub',
      description: 'South Indian',
      cuisineTypes: ['SOUTH_INDIAN'],
      line1: '12 MG Road',
      line2: '',
      city: 'Bengaluru',
      pincode: '560001',
      latitude: '12.97',
      longitude: '77.59',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Spice Hub');
      expect(
        'commissionPct' in (result.value as Record<string, unknown>),
      ).toBe(false);
    }
  });

  it('whitelists review sort fields', () => {
    expect(isReviewSort('createdAt')).toBe(true);
    expect(isReviewSort('restaurantRating')).toBe(true);
    expect(isReviewSort('totalAmount')).toBe(false);
  });
});
