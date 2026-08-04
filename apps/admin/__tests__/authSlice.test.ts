import reducer, {
  clearSession,
  markCookieSessionValid,
  setSession,
  selectIsAuthenticated,
} from '../features/auth/authSlice';

describe('authSlice', () => {
  it('setSession authenticates without token fields', () => {
    const state = reducer(
      undefined,
      setSession({
        userId: 'admin-1',
        role: 'SUPER_ADMIN',
      }),
    );
    expect(state.authStatus).toBe('authenticated');
    expect(state.userType).toBe('ADMIN');
    expect(state.role).toBe('SUPER_ADMIN');
    expect(selectIsAuthenticated({ auth: state })).toBe(true);
    expect('accessToken' in state).toBe(false);
    expect('refreshToken' in state).toBe(false);
  });

  it('markCookieSessionValid authenticates without inventing role', () => {
    const state = reducer(undefined, markCookieSessionValid());
    expect(state.authStatus).toBe('authenticated');
    expect(state.userType).toBe('ADMIN');
    expect(state.role).toBeNull();
    expect(state.userId).toBeNull();
  });

  it('clearSession forces unauthenticated', () => {
    const authenticated = reducer(
      undefined,
      setSession({ userId: 'a', role: 'OPS' }),
    );
    const cleared = reducer(authenticated, clearSession());
    expect(cleared.authStatus).toBe('unauthenticated');
    expect(cleared.role).toBeNull();
  });
});
