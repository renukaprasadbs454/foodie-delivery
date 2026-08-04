import { isForceLogoutError, mapErrorCode } from '../api/errorMapping';

describe('errorMapping', () => {
  it('maps VALIDATION_FAILED to INLINE_FIELD', () => {
    expect(mapErrorCode('VALIDATION_FAILED').treatment).toBe('INLINE_FIELD');
  });

  it('maps TOKEN_REUSE_DETECTED to FORCE_LOGOUT', () => {
    expect(mapErrorCode('TOKEN_REUSE_DETECTED').treatment).toBe('FORCE_LOGOUT');
    expect(isForceLogoutError('TOKEN_REUSE_DETECTED')).toBe(true);
  });

  it('maps RATE_LIMITED to TOAST', () => {
    expect(mapErrorCode('RATE_LIMITED').treatment).toBe('TOAST');
  });

  it('maps RESOURCE_NOT_FOUND to FULL_SCREEN', () => {
    expect(mapErrorCode('RESOURCE_NOT_FOUND').treatment).toBe('FULL_SCREEN');
  });

  it('falls back to GENERIC for unknown codes', () => {
    expect(mapErrorCode('SOME_FUTURE_CODE').treatment).toBe('GENERIC');
  });
});
