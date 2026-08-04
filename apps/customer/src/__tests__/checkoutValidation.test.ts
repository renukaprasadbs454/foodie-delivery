import {
  isAddressId,
  MAX_COUPON_CODE_LENGTH,
  validateCouponCode,
} from '../features/checkout/types';

describe('P2-CUS-04 checkout helpers', () => {
  it('requires address UUID', () => {
    expect(isAddressId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isAddressId('bad')).toBe(false);
  });

  it('validates coupon length ≤30', () => {
    expect(validateCouponCode('SAVE10').ok).toBe(true);
    expect(validateCouponCode('').ok).toBe(false);
    expect(validateCouponCode('x'.repeat(MAX_COUPON_CODE_LENGTH + 1)).ok).toBe(
      false,
    );
  });
});
