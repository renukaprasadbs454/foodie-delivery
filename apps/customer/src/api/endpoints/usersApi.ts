import { baseApi } from '../baseApi';
import type {
  CustomerProfile,
  ProfileImageUploadResult,
  UpdateProfileRequest,
} from '../../features/profile/types';

/**
 * User profile RTK — P2-CUS-07 (UI-API Profile + API §2.1 / §2.2 / image upload).
 */
export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query<CustomerProfile, void>({
      query: () => '/api/v1/users/me',
      providesTags: [{ type: 'User', id: 'ME' }],
      keepUnusedDataFor: 120,
    }),
    updateMyProfile: builder.mutation<CustomerProfile, UpdateProfileRequest>({
      query: (body) => ({
        url: '/api/v1/users/me',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'ME' }],
    }),
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
      invalidatesTags: [{ type: 'User', id: 'ME' }],
    }),
  }),
});

export const {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useUploadProfileImageMutation,
} = usersApi;
