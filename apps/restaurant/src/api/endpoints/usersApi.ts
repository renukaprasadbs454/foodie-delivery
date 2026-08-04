import { baseApi } from '../baseApi';

export type ProfileImageUploadResult = {
  fileKey: string;
  uploadedAt?: string;
};

/**
 * User profile-image RTK — P2-RES-04 (UI-API Restaurant Profile Endpoint 3).
 * Backend may restrict to CUSTOMER; residual if RESTAURANT receives 403.
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
          url: '/api/v1/users/me/profile-image',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [{ type: 'Restaurant', id: 'LIST' }],
    }),
  }),
});

export const { useUploadProfileImageMutation } = usersApi;
