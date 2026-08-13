import { baseApi } from '../baseApi';
import type { ProfileImageUploadResult } from '../../features/kyc/types';

/**
 * User profile-image RTK — P2-DEL-01 (UI-API KYC Endpoint 2).
 */
export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadProfileImage: builder.mutation<
      ProfileImageUploadResult,
      { uri: string; mimeType: string; fileName: string }
    >({
      query: ({ uri, mimeType, fileName }) => {
        const formData = new FormData();
        formData.append('file', {
          uri,
          type: mimeType,
          name: fileName,
        } as unknown as Blob);
        return {
          url: '/api/v1/delivery/me/profile-image',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [{ type: 'Delivery', id: 'PROFILE' }],
    }),
  }),
});

export const { useUploadProfileImageMutation } = usersApi;
