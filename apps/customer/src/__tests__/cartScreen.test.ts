import {
  canProceedToCheckout,
  isCartItemId,
} from '../features/cart/types';

describe('P2-CUS-03 cart helpers', () => {
  it('validates cart item UUID paths', () => {
    expect(isCartItemId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isCartItemId('optimistic-temp')).toBe(false);
  });

  it('disables checkout when cart has no lines', () => {
    expect(canProceedToCheckout(0)).toBe(false);
    expect(canProceedToCheckout(1)).toBe(true);
  });
});
