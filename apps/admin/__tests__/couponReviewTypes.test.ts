import {
  isCouponUuid,
  isDiscountType,
  validateCreateCoupon,
} from '../features/coupons/types';
import {
  isRestaurantUuid,
  isReviewSort,
} from '../features/reviews/types';

describe('P2-ADM-05 coupon / review helpers', () => {
  it('validates coupon code and create body', () => {
    expect(isDiscountType('PERCENT')).toBe(true);
    expect(isDiscountType('BOGO')).toBe(false);
    expect(isCouponUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);

    const ok = validateCreateCoupon({
      code: 'save10',
      discountType: 'PERCENT',
      value: '10',
      minOrderAmount: '100',
      maxDiscountAmount: '50',
      expiryDate: '2099-01-01',
      usageLimitTotal: '',
      usageLimitPerUser: '1',
      restaurantId: '',
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.body.code).toBe('SAVE10');
      expect(ok.body.maxDiscountAmount).toBe(50);
    }

    const percentMissingCap = validateCreateCoupon({
      code: 'SAVE10',
      discountType: 'PERCENT',
      value: '10',
      minOrderAmount: '0',
      maxDiscountAmount: '',
      expiryDate: '2099-01-01',
      usageLimitTotal: '',
      usageLimitPerUser: '1',
      restaurantId: '',
    });
    expect(percentMissingCap.ok).toBe(false);
  });

  it('validates review restaurant UUID and sort whitelist', () => {
    expect(isRestaurantUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isReviewSort('-createdAt')).toBe(true);
    expect(isReviewSort('bad')).toBe(false);
  });
});
