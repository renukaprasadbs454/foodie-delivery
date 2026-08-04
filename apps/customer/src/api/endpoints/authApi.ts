import { baseApi } from '../baseApi';

/**
 * P2-AUTH-01 — Customer auth endpoints (frozen API Module 1 / UI-API Splash·Login·OTP).
 * Injected into the single app baseApi — no second createApi.
 */

export type AuthTokenData = {
  accessToken: string;
  refreshToken: string;
  userType: string;
  userId: string;
  isNewUser?: boolean;
};

export type RequestOtpBody = {
  phoneNumber: string;
};

export type VerifyOtpBody = {
  phoneNumber: string;
  otp: string;
  userType: 'CUSTOMER';
};

export type GoogleAuthBody = {
  idToken: string;
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
      query: (body) => ({
        url: '/api/v1/auth/otp/request',
        method: 'POST',
        body,
      }),
    }),
    verifyOtp: builder.mutation<AuthTokenData, VerifyOtpBody>({
      query: (body) => ({
        url: '/api/v1/auth/otp/verify',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Auth'],
    }),
    googleAuth: builder.mutation<AuthTokenData, GoogleAuthBody>({
      query: (body) => ({
        url: '/api/v1/auth/google',
        method: 'POST',
        body,
      }),
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
  useGoogleAuthMutation,
  useLogoutMutation,
} = authApi;
