import {
  validateCategoryName,
  validateMenuItemForm,
  validateVariantForm,
} from '../features/menu/types';

describe('menu validation (P2-RES-03)', () => {
  it('validates category name length', () => {
    expect(validateCategoryName('').ok).toBe(false);
    expect(validateCategoryName('Starters').ok).toBe(true);
    expect(validateCategoryName('x'.repeat(101)).ok).toBe(false);
  });

  it('validates menu item create payload', () => {
    const ok = validateMenuItemForm({
      categoryId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Masala Dosa',
      description: '',
      basePrice: '120.50',
      isVeg: true,
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.value.basePrice).toBe(120.5);
      expect(ok.value.isVeg).toBe(true);
    }
    expect(
      validateMenuItemForm({
        categoryId: 'bad',
        name: 'X',
        description: '',
        basePrice: '0',
        isVeg: true,
      }).ok,
    ).toBe(false);
  });

  it('rejects variant when base + delta <= 0', () => {
    expect(
      validateVariantForm({
        name: 'Half',
        priceDelta: '-50',
        basePrice: 40,
      }).ok,
    ).toBe(false);
    expect(
      validateVariantForm({
        name: 'Full',
        priceDelta: '20',
        basePrice: 100,
      }).ok,
    ).toBe(true);
  });
});
