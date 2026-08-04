jest.mock('foodie-shared-rn', () => ({
  PHONE_REGEX: /^\+91[6-9]\d{9}$/,
}));

import {
  isValidDeliveryPhone,
  normalizeDeliveryPhone,
} from '../features/auth/phone';

describe('P2-AUTH-03 phone helpers', () => {
  it('normalizes 10-digit Indian mobiles to +91', () => {
    expect(normalizeDeliveryPhone('9876543210')).toBe('+919876543210');
  });

  it('validates contracted phone regex', () => {
    expect(isValidDeliveryPhone('+919876543210')).toBe(true);
    expect(isValidDeliveryPhone('9876543210')).toBe(false);
  });
});
