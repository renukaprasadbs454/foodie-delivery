import reducer, {
  clearCredentials,
  setCredentials,
  selectIsAuthenticated,
} from '../features/auth/authSlice';

describe('authSlice', () => {
  it('setCredentials authenticates without profile fields', () => {
    const state = reducer(
      undefined,
      setCredentials({
        accessToken: 'a',
        refreshToken: 'r',
        userType: 'DELIVERY_PARTNER',
        userId: 'u1',
        isNewUser: true,
      }),
    );
    expect(state.authStatus).toBe('authenticated');
    expect(state.userType).toBe('DELIVERY_PARTNER');
    expect(state.userId).toBe('u1');
    expect(selectIsAuthenticated({ auth: state })).toBe(true);
    expect('name' in state).toBe(false);
  });

  it('clearCredentials forces unauthenticated', () => {
    const authenticated = reducer(
      undefined,
      setCredentials({
        accessToken: 'a',
        refreshToken: 'r',
        userType: 'DELIVERY_PARTNER',
        userId: 'u1',
      }),
    );
    const cleared = reducer(authenticated, clearCredentials());
    expect(cleared.authStatus).toBe('unauthenticated');
    expect(cleared.accessToken).toBeNull();
    expect(cleared.refreshToken).toBeNull();
  });
});
