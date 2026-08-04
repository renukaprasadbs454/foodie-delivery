import {
  initialsFromName,
  validateAddressForm,
  validateEmail,
  validateFullName,
} from '../features/profile/types';

describe('P2-CUS-07 profile and address validation', () => {
  it('validates fullName length', () => {
    expect(validateFullName('A').ok).toBe(false);
    expect(validateFullName('Ada Lovelace').ok).toBe(true);
  });

  it('validates email format', () => {
    expect(validateEmail('not-an-email').ok).toBe(false);
    expect(validateEmail('ada@example.com').ok).toBe(true);
  });

  it('validates address fields including pincode and coords', () => {
    const bad = validateAddressForm({
      label: '',
      line1: '',
      line2: '',
      city: 'City',
      pincode: '12',
      latitude: '12.9',
      longitude: '77.6',
      isDefault: false,
    });
    expect(bad.ok).toBe(false);

    const good = validateAddressForm({
      label: 'Home',
      line1: '12 MG Road',
      line2: '',
      city: 'Bengaluru',
      pincode: '560001',
      latitude: '12.9716',
      longitude: '77.5946',
      isDefault: true,
    });
    expect(good.ok).toBe(true);
    if (good.ok) {
      expect(good.value.isDefault).toBe(true);
      expect(good.value.pincode).toBe('560001');
    }
  });

  it('builds initials', () => {
    expect(initialsFromName('Ada Lovelace')).toBe('AL');
    expect(initialsFromName('')).toBe('?');
  });
});
