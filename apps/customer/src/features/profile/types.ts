/**
 * P2-CUS-07 profile / address forms — UI-API Profile + Addresses +
 * backend CustomerProfileResponseDto / UpdateProfileRequestDto /
 * AddAddressRequestDto.
 */

/** Same rule as shared `PINCODE_REGEX` / AddAddressRequestDto — keep local to avoid Jest barrel pulls. */
const PINCODE_RE = /^\d{6}$/;

export type CustomerProfile = {
  customerId: string;
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  defaultAddressId?: string | null;
  profileImageUrl?: string | null;
};

export type UpdateProfileRequest = {
  fullName: string;
  email: string;
};

export type ProfileImageUploadResult = {
  fileKey: string;
  uploadedAt?: string;
};

export type AddAddressRequest = {
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateFullName(
  value: string,
): { ok: true; fullName: string } | { ok: false; message: string } {
  const fullName = value.trim();
  if (fullName.length < 2 || fullName.length > 100) {
    return {
      ok: false,
      message: 'Full name must be between 2 and 100 characters.',
    };
  }
  return { ok: true, fullName };
}

export function validateEmail(
  value: string,
): { ok: true; email: string } | { ok: false; message: string } {
  const email = value.trim();
  if (email.length === 0 || email.length > 255 || !EMAIL_RE.test(email)) {
    return { ok: false, message: 'Enter a valid email address.' };
  }
  return { ok: true, email };
}

export function validateAddressForm(input: {
  label: string;
  line1: string;
  line2: string;
  city: string;
  pincode: string;
  latitude: string;
  longitude: string;
  isDefault: boolean;
}): { ok: true; value: AddAddressRequest } | { ok: false; message: string } {
  const label = input.label.trim();
  if (label.length > 50) {
    return { ok: false, message: 'Label must be at most 50 characters.' };
  }
  const line1 = input.line1.trim();
  if (!line1 || line1.length > 255) {
    return { ok: false, message: 'Line 1 is required (max 255).' };
  }
  const line2 = input.line2.trim();
  if (line2.length > 255) {
    return { ok: false, message: 'Line 2 must be at most 255 characters.' };
  }
  const city = input.city.trim();
  if (!city || city.length > 100) {
    return { ok: false, message: 'City is required (max 100).' };
  }
  const pincode = input.pincode.trim();
  if (!PINCODE_RE.test(pincode)) {
    return { ok: false, message: 'Pincode must be 6 digits.' };
  }
  const latitude = Number(input.latitude);
  const longitude = Number(input.longitude);
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      ok: false,
      message: 'Enter valid latitude (−90…90) and longitude (−180…180).',
    };
  }
  return {
    ok: true,
    value: {
      label: label || null,
      line1,
      line2: line2 || null,
      city,
      pincode,
      latitude,
      longitude,
      isDefault: input.isDefault,
    },
  };
}

export function initialsFromName(fullName?: string | null): string {
  if (!fullName?.trim()) return '?';
  const parts = fullName.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
}
