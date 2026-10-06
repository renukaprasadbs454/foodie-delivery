/**
 * P2-DEL-03 — Navigation / OTP helpers (UI-API + §8.4–§8.6).
 */

export type NavigationLeg = 'pickup' | 'drop';

export type LocationPingPayload = {
  latitude: number;
  longitude: number;
};

export type VerifyOtpRequest = {
  otp: string;
};

const OTP_RE = /^\d{6}$/;

export function isNavigationLeg(value: string): value is NavigationLeg {
  return value === 'pickup' || value === 'drop';
}

export function validateOtp(
  value: string,
): { ok: true; otp: string } | { ok: false; message: string } {
  const otp = value.trim();
  if (!OTP_RE.test(otp)) {
    return { ok: false, message: 'Enter the 6-digit OTP.' };
  }
  return { ok: true, otp };
}

export function isValidLatitude(value: number): boolean {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number): boolean {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function validatePingCoords(
  latitude: number,
  longitude: number,
): { ok: true; value: LocationPingPayload } | { ok: false; message: string } {
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return { ok: false, message: 'Invalid location coordinates.' };
  }
  return { ok: true, value: { latitude, longitude } };
}

/** Prefer drop leg once order is out for delivery / picked up. */
export function legForOrderStatus(status: string | undefined): NavigationLeg {
  if (
    status === 'OUT_FOR_DELIVERY' ||
    status === 'PICKED_UP' ||
    status === 'DELIVERED'
  ) {
    return 'drop';
  }
  return 'pickup';
}
