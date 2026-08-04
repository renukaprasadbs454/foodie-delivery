import { baseApi } from '../baseApi';

/**
 * P2-AUTH-04 — Admin auth BFF endpoints.
 * No login mutation (GAP-API-13). Logout + refresh are cookie/BFF only.
 */

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    logout: builder.mutation<null, void>({
      query: () => ({
        url: '/api/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const { useLogoutMutation } = authApi;
