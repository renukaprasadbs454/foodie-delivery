/**
 * Canonical validation regex constants — Blueprint §6 / 04_API_Contracts.md.
 * Never redefine per app or per screen.
 */
export const PHONE_REGEX = /^\+91[6-9]\d{9}$/;
export const OTP_REGEX = /^\d{6}$/;
export const PINCODE_REGEX = /^\d{6}$/;
export const COUPON_CODE_REGEX = /^[A-Z0-9_]{3,30}$/;
