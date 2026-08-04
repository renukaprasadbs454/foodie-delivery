jest.mock('foodie-shared-rn', () => ({
  PHONE_REGEX: /^\+91[6-9]\d{9}$/,
}));

import {
  isValidRestaurantPhone,
  normalizeRestaurantPhone,
} from '../features/auth/phone';

describe('P2-AUTH-02 phone helpers', () => {
  it('normalizes 10-digit Indian mobiles to +91', () => {
    expect(normalizeRestaurantPhone('9876543210')).toBe('+919876543210');
  });

  it('validates contracted phone regex', () => {
    expect(isValidRestaurantPhone('+919876543210')).toBe(true);
    expect(isValidRestaurantPhone('9876543210')).toBe(false);
  });
});
