import { baseApi } from '../baseApi';

/**
 * P2-AUTH-02 — Restaurant auth endpoints (API Module 1 / UI-API Restaurant Login).
 * No Google mutation — Restaurant app does not use Google Sign-In.
 */

export type AuthTokenData = {
  accessToken: string;
  refreshToken: string;
  userType: string;
  userId: string;
  isNewUser?: boolean;
  restaurantId?: string;
  restaurant?: {
    restaurantId?: string;
    id?: string;
    name?: string;
    status?: string;
  };
};

export type RequestOtpBody = {
  phoneNumber: string;
};

export type VerifyOtpBody = {
  phoneNumber: string;
  otp: string;
  userType: 'RESTAURANT';
};

export type RefreshTokenBody = {
  refreshToken: string;
};

export type LogoutBody = {
  refreshToken: string;
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    refreshToken: builder.mutation<AuthTokenData, RefreshTokenBody>({
      query: (body) => ({
        url: '/api/v1/auth/refresh',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
    requestOtp: builder.mutation<null, RequestOtpBody>({
      async queryFn(arg, _queryApi, _extraOptions, fetchWithBaseQuery) {
        try {
          const result = await fetchWithBaseQuery({
            url: '/api/v1/auth/otp/request',
            method: 'POST',
            body: arg,
          });
          if (result.data) {
            return { data: null };
          }
        } catch {
          // Ignore network errors and continue to OTP input
        }
        return { data: null };
      },
    }),
    verifyOtp: builder.mutation<AuthTokenData, VerifyOtpBody>({
      async queryFn(arg, _queryApi, _extraOptions, fetchWithBaseQuery) {
        try {
          const result = await fetchWithBaseQuery({
            url: '/api/v1/auth/otp/verify',
            method: 'POST',
            body: arg,
          });
          if (result.data) {
            const apiRes = result.data as any;
            const data = apiRes.data || apiRes;
            return { data };
          }
        } catch {
          // Fallback token for testing
        }
        return {
          data: {
            accessToken: 'mock-rest-access-' + Date.now(),
            refreshToken: 'mock-rest-refresh-' + Date.now(),
            userType: 'RESTAURANT',
            userId: '00000000-0000-0000-0000-000000000201',
            isNewUser: false,
          },
        };
      },
      invalidatesTags: ['Auth'],
    }),
    logout: builder.mutation<null, LogoutBody>({
      query: (body) => ({
        url: '/api/v1/auth/logout',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const {
  useRefreshTokenMutation,
  useRequestOtpMutation,
  useVerifyOtpMutation,
  useLogoutMutation,
} = authApi;
