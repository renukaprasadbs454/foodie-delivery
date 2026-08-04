import { isForceLogoutError, mapErrorCode } from '../api/errorMapping';

describe('errorMapping', () => {
  it('maps VALIDATION_FAILED to INLINE_FIELD', () => {
    expect(mapErrorCode('VALIDATION_FAILED').treatment).toBe('INLINE_FIELD');
  });

  it('maps TOKEN_REUSE_DETECTED to FORCE_LOGOUT', () => {
    expect(isForceLogoutError('TOKEN_REUSE_DETECTED')).toBe(true);
  });

  it('falls back to GENERIC for unknown codes', () => {
    expect(mapErrorCode('UNKNOWN_FUTURE').treatment).toBe('GENERIC');
  });
});
