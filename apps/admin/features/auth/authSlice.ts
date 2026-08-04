import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AdminRole, AuthStatus, UserType } from 'foodie-shared-web';

/**
 * Admin authSlice — Blueprint §11.1 / shared-web AdminSessionIdentity.
 * Identity/session only. NEVER stores accessToken or refreshToken.
 */
export type AuthState = {
  userType: UserType | null;
  userId: string | null;
  role: AdminRole | null;
  authStatus: AuthStatus;
};

const initialState: AuthState = {
  userType: null,
  userId: null,
  role: null,
  authStatus: 'idle',
};

export type SetSessionPayload = {
  userId: string;
  role: AdminRole;
  userType?: UserType;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<SetSessionPayload>) {
      state.userType = action.payload.userType ?? 'ADMIN';
      state.userId = action.payload.userId;
      state.role = action.payload.role;
      state.authStatus = 'authenticated';
    },
/**
 * Cookie session proven via BFF refresh — Blueprint §11.3 / §12.1.
 * Fallback when refresh succeeds without identity payload.
 */
    markCookieSessionValid(state) {
      state.userType = 'ADMIN';
      state.authStatus = 'authenticated';
    },
    setAuthStatus(state, action: PayloadAction<AuthStatus>) {
      state.authStatus = action.payload;
    },
    clearSession() {
      return { ...initialState, authStatus: 'unauthenticated' as const };
    },
  },
});

export const { setSession, setAuthStatus, markCookieSessionValid, clearSession } =
  authSlice.actions;

export const selectAuthStatus = (state: { auth: AuthState }) =>
  state.auth.authStatus;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.authStatus === 'authenticated';
export const selectAdminRole = (state: { auth: AuthState }) => state.auth.role;
export const selectUserId = (state: { auth: AuthState }) => state.auth.userId;

export default authSlice.reducer;
