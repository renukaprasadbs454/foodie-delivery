import {
  validateRegistrationForm,
  isCuisineType,
} from '../features/onboarding/types';

describe('validateRegistrationForm (P2-RES-01)', () => {
  const valid = {
    name: 'Spice Hub',
    description: 'South Indian',
    cuisineTypes: ['SOUTH_INDIAN'],
    line1: '12 MG Road',
    line2: '',
    city: 'Bengaluru',
    pincode: '560001',
    latitude: '12.97',
    longitude: '77.59',
  };

  it('accepts a valid registration payload', () => {
    const result = validateRegistrationForm(valid);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe('Spice Hub');
      expect(result.value.address.pincode).toBe('560001');
      expect(result.value.cuisineTypes).toEqual(['SOUTH_INDIAN']);
    }
  });

  it('rejects empty cuisine selection', () => {
    const result = validateRegistrationForm({ ...valid, cuisineTypes: [] });
    expect(result.ok).toBe(false);
  });

  it('rejects invalid pincode', () => {
    const result = validateRegistrationForm({ ...valid, pincode: '56A001' });
    expect(result.ok).toBe(false);
  });

  it('rejects out-of-range coordinates', () => {
    const result = validateRegistrationForm({ ...valid, latitude: '99' });
    expect(result.ok).toBe(false);
  });

  it('recognizes cuisine enum members', () => {
    expect(isCuisineType('CHINESE')).toBe(true);
    expect(isCuisineType('TACOS')).toBe(false);
  });
});
