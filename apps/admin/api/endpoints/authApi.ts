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

export type AdminUserProfile = {
  adminUserId: string;
  userCredentialId: string;
  fullName: string;
  role: AdminRole;
  profileImageKey?: string | null;
  restaurantId?: string | null;
  permissions?: string[];
};

export const authApi = baseApi.injectEndpoints({
  overrideExisting: true,
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
    getAdminMe: builder.query<AdminUserProfile, void>({
      query: () => ({
        url: '/api/bff/admin/users/me',
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        if (response && response.data) {
          return response.data;
        }
        return response;
      },
      providesTags: ['Auth'],
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useGetAdminMeQuery } = authApi;
