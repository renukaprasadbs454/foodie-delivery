/** Client UX validation for Admin Login — UI-API Admin Login. */

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidAdminEmail(email: string): boolean {
  return EMAIL_FORMAT.test(email.trim());
}

export function isNonEmptyPassword(password: string): boolean {
  return password.trim().length > 0;
}
