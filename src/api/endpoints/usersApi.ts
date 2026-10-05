import { baseApi } from '../baseApi';
import type { ProfileImageUploadResult } from '@/features/kyc/types';
import { createUploadFormData } from './deliveryApi';

/**
 * User profile-image RTK — P2-DEL-01 (UI-API KYC Endpoint 2).
 */
export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadProfileImage: builder.mutation<
      ProfileImageUploadResult,
      { uri: string; mimeType: string; fileName: string; webFile?: any }
    >({
      queryFn: async (args, _queryApi, _extraOptions, fetchWithBQ) => {
        try {
          const formData = await createUploadFormData({}, {
            name: 'file',
            uri: args.uri,
            mimeType: args.mimeType,
            fileName: args.fileName,
            webFile: args.webFile,
          });
          const result = await fetchWithBQ({
            url: '/api/v1/delivery/me/profile-image',
            method: 'POST',
            body: formData,
          });
          if (result.error) return { error: result.error };
          return { data: result.data as ProfileImageUploadResult };
        } catch (e: any) {
          return { error: { status: 'CUSTOM_ERROR', error: e.message } as any };
        }
      },
      invalidatesTags: [{ type: 'Delivery', id: 'PROFILE' }],
    }),
  }),
});

export const { useUploadProfileImageMutation } = usersApi;
