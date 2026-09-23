import { baseApi } from '../baseApi';
import type { DeliveryDocType, DeliveryDocumentUploadResult, DeliveryProfile } from '@/features/kyc/types';
import type { AvailabilityState, DeliveryAssignment, DeliveryOffer } from '@/features/home/types';
import { normalizeOffers } from '@/features/home/types';
import type { LocationPingPayload } from '@/features/navigation/types';
import { setIsOnline } from '@/features/home/availabilitySlice';

/**
 * Delivery RTK — P2-DEL-01…03.
 * No GET /delivery/me (GAP-API-08). No decline offer (GAP-API-10).
 */
async function prepareFileFormData(
  uri: string,
  mimeType: string,
  fileName: string,
  webFile?: any,
  extraParams?: Record<string, string>,
): Promise<FormData> {
  const formData = new FormData();
  if (extraParams) {
    Object.entries(extraParams).forEach(([k, v]) => formData.append(k, v));
  }

  if (webFile) {
    formData.append('file', webFile);
    return formData;
  }

  if (
    typeof window !== 'undefined' &&
    (uri.startsWith('blob:') || uri.startsWith('data:') || uri.startsWith('http'))
  ) {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const file = new File([blob], fileName || 'upload.jpg', {
        type: blob.type || mimeType || 'image/jpeg',
      });
      formData.append('file', file);
      return formData;
    } catch {
      // Fallback
    }
  }

  formData.append('file', {
    uri,
    type: mimeType || 'image/jpeg',
    name: fileName || 'upload.jpg',
  } as unknown as Blob);
  return formData;
}

export const deliveryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDeliveryProfile: builder.query<DeliveryProfile, void>({
      query: () => '/api/v1/delivery/me',
      providesTags: [{ type: 'Delivery', id: 'PROFILE' }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data && typeof data.isOnline === 'boolean') {
            dispatch(setIsOnline(data.isOnline));
          }
        } catch {
          // Ignored if query fails
        }
      },
    }),
    upsertDeliveryProfile: builder.mutation<DeliveryProfile, { fullName: string; vehicleType: string; vehicleNumber?: string }>({
      query: (body) => ({
        url: '/api/v1/delivery/me',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'Delivery', id: 'PROFILE' }],
    }),
    uploadDeliveryDocument: builder.mutation<
      DeliveryDocumentUploadResult,
      {
        docType: DeliveryDocType;
        uri: string;
        mimeType: string;
        fileName: string;
        webFile?: any;
      }
    >({
      queryFn: async ({ docType, uri, mimeType, fileName, webFile }, _api, _extraOptions, baseQuery) => {
        const formData = await prepareFileFormData(uri, mimeType, fileName, webFile, { docType });
        const result = await baseQuery({
          url: '/api/v1/delivery/me/documents',
          method: 'POST',
          body: formData,
        });
        if (result.error) return { error: result.error };
        return { data: result.data as DeliveryDocumentUploadResult };
      },
      invalidatesTags: [{ type: 'Delivery', id: 'DOCS' }],
    }),
    setAvailability: builder.mutation<AvailabilityState, { isOnline: boolean }>(
      {
        query: (body) => ({
          url: '/api/v1/delivery/availability',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }),
        invalidatesTags: [
          { type: 'Delivery', id: 'AVAILABILITY' },
          { type: 'Delivery', id: 'PROFILE' },
        ],
        async onQueryStarted({ isOnline }, { dispatch, queryFulfilled }) {
          try {
            const { data } = await queryFulfilled;
            dispatch(setIsOnline(Boolean(data?.isOnline ?? isOnline)));
          } catch {
            // Ignored if mutation fails
          }
        },
      },
    ),
    getDeliveryOffers: builder.query<DeliveryOffer[], void>({
      query: () => '/api/v1/delivery/offers',
      transformResponse: (response: unknown) => normalizeOffers(response),
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ assignmentId }) => ({
              type: 'Delivery' as const,
              id: `OFFER-${assignmentId}`,
            })),
            { type: 'Delivery', id: 'OFFERS' },
          ]
          : [{ type: 'Delivery', id: 'OFFERS' }],
      keepUnusedDataFor: 15,
    }),
    acceptAssignment: builder.mutation<DeliveryAssignment, string>({
      query: (assignmentId) => ({
        url: `/api/v1/delivery/assignments/${assignmentId}/accept`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {},
      }),
      invalidatesTags: (_result, _error, assignmentId) => [
        { type: 'Delivery', id: 'OFFERS' },
        { type: 'Delivery', id: `OFFER-${assignmentId}` },
        { type: 'Order', id: 'LIST' },
      ],
    }),
    locationPing: builder.mutation<null, LocationPingPayload>({
      query: (body) => ({
        url: '/api/v1/delivery/location-ping',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        responseHandler: async (response) => {
          const text = await response.text();
          if (!text) return null;
          try {
            return JSON.parse(text) as unknown;
          } catch {
            return null;
          }
        },
      }),
    }),
    verifyPickupOtp: builder.mutation<
      DeliveryAssignment,
      { assignmentId: string; orderId: string; otp: string }
    >({
      query: ({ assignmentId, otp }) => ({
        url: `/api/v1/delivery/assignments/${assignmentId}/verify-pickup`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { otp },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Delivery', id: 'OFFERS' },
        { type: 'Order', id: 'LIST' },
        { type: 'Order', id: arg.orderId },
      ],
    }),
    verifyDeliveryOtp: builder.mutation<
      DeliveryAssignment,
      { assignmentId: string; orderId: string; otp: string }
    >({
      query: ({ assignmentId, otp }) => ({
        url: `/api/v1/delivery/assignments/${assignmentId}/verify-delivery`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { otp },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Delivery', id: 'OFFERS' },
        { type: 'Order', id: 'LIST' },
        { type: 'Order', id: arg.orderId },
        { type: 'Wallet', id: 'BALANCE' },
      ],
    }),
    uploadDeliveryProfileImage: builder.mutation<
      { profileImageKey: string; uploadedAt: string },
      { uri: string; mimeType: string; fileName: string; webFile?: any }
    >({
      queryFn: async ({ uri, mimeType, fileName, webFile }, _api, _extraOptions, baseQuery) => {
        const formData = await prepareFileFormData(uri, mimeType, fileName, webFile);
        const result = await baseQuery({
          url: '/api/v1/delivery/me/profile-image',
          method: 'POST',
          body: formData,
        });
        if (result.error) return { error: result.error };
        return { data: result.data as { profileImageKey: string; uploadedAt: string } };
      },
      invalidatesTags: [{ type: 'Delivery', id: 'PROFILE' }],
    }),
    verifyFace: builder.mutation<
      boolean,
      { assignmentId: string; uri: string; mimeType: string; fileName: string; webFile?: any }
    >({
      queryFn: async ({ assignmentId, uri, mimeType, fileName, webFile }, _api, _extraOptions, baseQuery) => {
        const formData = await prepareFileFormData(uri, mimeType, fileName, webFile);
        const result = await baseQuery({
          url: `/api/v1/delivery/assignments/${assignmentId}/verify-face`,
          method: 'POST',
          body: formData,
        });
        if (result.error) return { error: result.error };
        return { data: result.data as boolean };
      },
    }),
    verifyFaceForOnline: builder.mutation<
      boolean,
      { uri: string; mimeType: string; fileName: string; webFile?: any }
    >({
      queryFn: async ({ uri, mimeType, fileName, webFile }, _api, _extraOptions, baseQuery) => {
        const formData = await prepareFileFormData(uri, mimeType, fileName, webFile);
        const result = await baseQuery({
          url: '/api/v1/delivery/me/verify-face',
          method: 'POST',
          body: formData,
        });
        if (result.error) return { error: result.error };
        return { data: result.data as boolean };
      },
    }),
    getDeliveryBankDetails: builder.query<DeliveryBankDetails | null, void>({
      query: () => '/api/v1/delivery/me/bank-details',
      providesTags: [{ type: 'Delivery', id: 'BANK_DETAILS' }],
    }),
    upsertDeliveryBankDetails: builder.mutation<DeliveryBankDetails, UpsertDeliveryBankDetailsPayload>({
      query: (body) => ({
        url: '/api/v1/delivery/me/bank-details',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [
        { type: 'Delivery', id: 'BANK_DETAILS' },
        { type: 'Delivery', id: 'PROFILE' },
      ],
    }),
  }),
});

export interface DeliveryBankDetails {
  id?: string;
  deliveryPartnerId?: string;
  accountHolderName: string;
  accountNumber: string;
  maskedAccountNumber?: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  accountType?: string;
  verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertDeliveryBankDetailsPayload {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  accountType?: string;
}

export const {
  useGetDeliveryProfileQuery,
  useUpsertDeliveryProfileMutation,
  useUploadDeliveryDocumentMutation,
  useSetAvailabilityMutation,
  useGetDeliveryOffersQuery,
  useAcceptAssignmentMutation,
  useLocationPingMutation,
  useVerifyPickupOtpMutation,
  useVerifyDeliveryOtpMutation,
  useUploadDeliveryProfileImageMutation,
  useVerifyFaceMutation,
  useVerifyFaceForOnlineMutation,
  useGetDeliveryBankDetailsQuery,
  useUpsertDeliveryBankDetailsMutation,
} = deliveryApi;
