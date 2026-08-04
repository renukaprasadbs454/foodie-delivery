import {
  validateDeliveryRating,
  validateRestaurantRating,
  validateReviewComment,
} from '../features/reviews/types';

describe('P2-CUS-08 review validation', () => {
  it('requires restaurant rating 1–5', () => {
    expect(validateRestaurantRating(0).ok).toBe(false);
    expect(validateRestaurantRating(6).ok).toBe(false);
    expect(validateRestaurantRating(4).ok).toBe(true);
  });

  it('allows optional delivery rating', () => {
    expect(validateDeliveryRating(null).ok).toBe(true);
    expect(validateDeliveryRating(3).ok).toBe(true);
    expect(validateDeliveryRating(0).ok).toBe(false);
  });

  it('limits comment length', () => {
    expect(validateReviewComment('').ok).toBe(true);
    expect(validateReviewComment('Great food').ok).toBe(true);
    expect(validateReviewComment('x'.repeat(1001)).ok).toBe(false);
  });
});
