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

const getSavedRole = (): AdminRole => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('foodie_admin_role') || sessionStorage.getItem('foodie_admin_role');
    if (saved) return saved as AdminRole;
  }
  return 'SUPER_ADMIN';
};

const initialState: AuthState = {
  userType: 'ADMIN',
  userId: 'admin-user-001',
  role: getSavedRole(),
  authStatus: 'authenticated',
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
      if (typeof window !== 'undefined' && action.payload.role) {
        localStorage.setItem('foodie_admin_role', action.payload.role);
        sessionStorage.setItem('foodie_admin_role', action.payload.role);
      }
    },
    markCookieSessionValid(state) {
      state.userType = 'ADMIN';
      state.userId = state.userId || 'admin-user-001';
      if (!state.role) {
        state.role = getSavedRole();
      }
      state.authStatus = 'authenticated';
    },
    setAuthStatus(state, action: PayloadAction<AuthStatus>) {
      state.authStatus = action.payload;
    },
    clearSession() {
      return {
        userType: null,
        userId: null,
        role: null,
        authStatus: 'unauthenticated' as const,
      };
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
