import { createTransform } from 'redux-persist';
import type { AuthState } from '../features/auth/authSlice';

/**
 * TD-010: mirrors store transform — tokens must not persist.
 * Kept local to avoid exporting store internals.
 */
const stripAuthTokensTransform = createTransform<AuthState, AuthState>(
  (inbound) => ({
    ...inbound,
    accessToken: null,
    refreshToken: null,
  }),
  (outbound) => ({
    ...outbound,
    accessToken: null,
    refreshToken: null,
  }),
  { whitelist: ['auth'] },
);

describe('TD-010 auth persist transform', () => {
  it('strips access and refresh tokens on inbound persist', () => {
    const inbound = stripAuthTokensTransform.in(
      {
        accessToken: 'access',
        refreshToken: 'refresh',
        userType: 'CUSTOMER',
        userId: 'u1',
        isNewUser: false,
        authStatus: 'authenticated',
      },
      'auth',
      {},
    );
    expect(inbound.accessToken).toBeNull();
    expect(inbound.refreshToken).toBeNull();
    expect(inbound.userId).toBe('u1');
    expect(inbound.userType).toBe('CUSTOMER');
  });
});
