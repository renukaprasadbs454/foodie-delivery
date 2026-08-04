import { baseApi } from '../baseApi';
import type { AdminRole } from 'foodie-shared-web';

export type AdminLoginRequest = {
  email: string;
  password: string;
  deviceInfo?: string;
};

export type AdminLoginIdentity = {
  userId: string;
  userType: 'ADMIN';
  role: AdminRole;
};

/**
 * P2-AUTH-04 / GAP-API-13 — Admin auth BFF endpoints.
 * Login sets httpOnly cookies via BFF; logout + refresh are cookie/BFF only.
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AdminLoginIdentity, AdminLoginRequest>({
      query: (body) => ({
        url: '/api/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<null, void>({
      query: () => ({
        url: '/api/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation } = authApi;
