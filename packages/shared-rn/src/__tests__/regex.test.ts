import {
  COUPON_CODE_REGEX,
  OTP_REGEX,
  PHONE_REGEX,
  PINCODE_REGEX,
} from '../utils/regex';

describe('canonical validation regex', () => {
  it('accepts Indian E.164 mobiles', () => {
    expect(PHONE_REGEX.test('+919876543210')).toBe(true);
    expect(PHONE_REGEX.test('+915876543210')).toBe(false);
    expect(PHONE_REGEX.test('9876543210')).toBe(false);
  });

  it('accepts 6-digit OTP', () => {
    expect(OTP_REGEX.test('123456')).toBe(true);
    expect(OTP_REGEX.test('12345')).toBe(false);
  });

  it('accepts 6-digit pincode', () => {
    expect(PINCODE_REGEX.test('560103')).toBe(true);
    expect(PINCODE_REGEX.test('56010')).toBe(false);
  });

  it('accepts coupon code pattern', () => {
    expect(COUPON_CODE_REGEX.test('WELCOME50')).toBe(true);
    expect(COUPON_CODE_REGEX.test('ab')).toBe(false);
  });
});
