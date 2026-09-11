import { PHONE_REGEX } from './regex';

/** Format E.164 Indian mobile (+91XXXXXXXXXX) for display. */
export function formatPhoneDisplay(phoneE164: string): string {
  if (!PHONE_REGEX.test(phoneE164)) {
    return phoneE164;
  }
  const national = phoneE164.slice(3);
  return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
}

/** Mask phone for non-sensitive UI (keeps country code + last 4). */
export function maskPhone(phoneE164: string): string {
  if (!PHONE_REGEX.test(phoneE164)) {
    return '••••••••••';
  }
  const last4 = phoneE164.slice(-4);
  return `+91 ******${last4}`;
}

export function isValidPhone(phoneE164: string): boolean {
  return PHONE_REGEX.test(phoneE164);
}
