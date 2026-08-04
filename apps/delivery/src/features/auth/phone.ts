import { PHONE_REGEX } from 'foodie-shared-rn';

/** Normalize common Indian mobile input to contracted `+91##########`. */
export function normalizeDeliveryPhone(input: string): string {
  const trimmed = input.trim().replace(/[\s-]/g, '');
  if (trimmed.startsWith('+91')) return trimmed;
  if (trimmed.startsWith('91') && trimmed.length === 12) return `+${trimmed}`;
  if (/^[6-9]\d{9}$/.test(trimmed)) return `+91${trimmed}`;
  return trimmed;
}

export function isValidDeliveryPhone(phoneNumber: string): boolean {
  return PHONE_REGEX.test(phoneNumber);
}
