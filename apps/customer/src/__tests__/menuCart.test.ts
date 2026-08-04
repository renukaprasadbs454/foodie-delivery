import {
  isClearCartConflict,
  isMenuRestaurantId,
  MAX_CART_NOTES_LENGTH,
  validateAddCartItem,
} from '../features/menu/types';

describe('P2-CUS-02 menu / cart helpers', () => {
  it('accepts UUID restaurant ids for menu route', () => {
    expect(isMenuRestaurantId('550e8400-e29b-41d4-a716-446655440000')).toBe(
      true,
    );
    expect(isMenuRestaurantId('bad')).toBe(false);
  });

  it('validates quantity 1–20 and notes ≤500', () => {
    expect(
      validateAddCartItem({
        quantity: 1,
        notes: '',
        requiresVariant: false,
        variantId: null,
      }).ok,
    ).toBe(true);
    expect(
      validateAddCartItem({
        quantity: 0,
        notes: '',
        requiresVariant: false,
        variantId: null,
      }).ok,
    ).toBe(false);
    expect(
      validateAddCartItem({
        quantity: 21,
        notes: '',
        requiresVariant: false,
        variantId: null,
      }).ok,
    ).toBe(false);
    expect(
      validateAddCartItem({
        quantity: 2,
        notes: 'x'.repeat(MAX_CART_NOTES_LENGTH + 1),
        requiresVariant: false,
        variantId: null,
      }).ok,
    ).toBe(false);
  });

  it('requires variant when item has variants', () => {
    expect(
      validateAddCartItem({
        quantity: 1,
        notes: '',
        requiresVariant: true,
        variantId: null,
      }).ok,
    ).toBe(false);
    expect(
      validateAddCartItem({
        quantity: 1,
        notes: '',
        requiresVariant: true,
        variantId: '550e8400-e29b-41d4-a716-446655440000',
      }).ok,
    ).toBe(true);
  });

  it('maps CART_RESTAURANT_CONFLICT to CLEAR_CART recovery', () => {
    expect(isClearCartConflict('CART_RESTAURANT_CONFLICT')).toBe(true);
    expect(isClearCartConflict('ITEM_UNAVAILABLE')).toBe(false);
  });
});
