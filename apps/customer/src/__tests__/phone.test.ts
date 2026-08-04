jest.mock('foodie-shared-rn', () => ({
  PHONE_REGEX: /^\+91[6-9]\d{9}$/,
}));

import {
  isValidCustomerPhone,
  normalizeCustomerPhone,
} from '../features/auth/phone';

describe('P2-AUTH-01 phone helpers', () => {
  it('normalizes 10-digit Indian mobiles to +91', () => {
    expect(normalizeCustomerPhone('9876543210')).toBe('+919876543210');
    expect(normalizeCustomerPhone('91 98765 43210')).toBe('+919876543210');
  });

  it('validates contracted phone regex', () => {
    expect(isValidCustomerPhone('+919876543210')).toBe(true);
    expect(isValidCustomerPhone('9876543210')).toBe(false);
    expect(isValidCustomerPhone('+911234567890')).toBe(false);
  });
});
