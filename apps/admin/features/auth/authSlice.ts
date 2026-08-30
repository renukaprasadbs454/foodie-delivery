import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AdminRole, AuthStatus, UserType } from 'foodie-shared-web';

/**
 * Admin authSlice — Blueprint §11.1 / shared-web AdminSessionIdentity.
 * Identity/session state driven strictly by backend authentication.
 */
export type AuthState = {
  userType: UserType | null;
  userId: string | null;
  role: AdminRole | null;
  fullName?: string | null;
  permissions?: string[];
  authStatus: AuthStatus;
};

const getSavedRole = (): AdminRole | null => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('foodie_admin_role') || sessionStorage.getItem('foodie_admin_role');
    if (saved) return saved as AdminRole;
  }
  return null;
};

const getSavedUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('foodie_admin_user_id') || sessionStorage.getItem('foodie_admin_user_id');
  }
  return null;
};

const initialState: AuthState = {
  userType: getSavedUserId() ? 'ADMIN' : null,
  userId: getSavedUserId(),
  role: getSavedRole(),
  fullName: null,
  permissions: [],
  authStatus: getSavedUserId() ? 'authenticated' : 'unauthenticated',
};

export type SetSessionPayload = {
  userId: string;
  role: AdminRole;
  userType?: UserType;
  fullName?: string;
  permissions?: string[];
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<SetSessionPayload>) {
      state.userType = action.payload.userType ?? 'ADMIN';
      state.userId = action.payload.userId;
      state.role = action.payload.role;
      state.fullName = action.payload.fullName ?? null;
      state.permissions = action.payload.permissions ?? [];
      state.authStatus = 'authenticated';
      if (typeof window !== 'undefined') {
        if (action.payload.role) {
          localStorage.setItem('foodie_admin_role', action.payload.role);
          sessionStorage.setItem('foodie_admin_role', action.payload.role);
        }
        if (action.payload.userId) {
          localStorage.setItem('foodie_admin_user_id', action.payload.userId);
          sessionStorage.setItem('foodie_admin_user_id', action.payload.userId);
        }
      }
    },
    markCookieSessionValid(state) {
      state.authStatus = 'authenticated';
      state.userType = 'ADMIN';
    },
    setAuthStatus(state, action: PayloadAction<AuthStatus>) {
      state.authStatus = action.payload;
    },
    clearSession() {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('foodie_admin_role');
        sessionStorage.removeItem('foodie_admin_role');
        localStorage.removeItem('foodie_admin_user_id');
        sessionStorage.removeItem('foodie_admin_user_id');
      }
      return {
        userType: null,
        userId: null,
        role: null,
        fullName: null,
        permissions: [],
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
