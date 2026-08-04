import {
  isNonEmptyPassword,
  isValidAdminEmail,
} from '../features/auth/validation';

describe('P2-AUTH-04 Admin Login client validation', () => {
  it('validates email format', () => {
    expect(isValidAdminEmail('ops@foodie.example')).toBe(true);
    expect(isValidAdminEmail('bad')).toBe(false);
  });

  it('requires non-empty password', () => {
    expect(isNonEmptyPassword('secret')).toBe(true);
    expect(isNonEmptyPassword('   ')).toBe(false);
  });
});
