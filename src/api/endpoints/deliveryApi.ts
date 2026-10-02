import { Platform } from 'react-native';
import { baseApi } from '../baseApi';
import type { DeliveryDocType, DeliveryDocumentUploadResult, DeliveryProfile } from '@/features/kyc/types';
import type { AvailabilityState, DeliveryAssignment, DeliveryOffer } from '@/features/home/types';
import { normalizeOffers } from '@/features/home/types';
import type { LocationPingPayload } from '@/features/navigation/types';
import { setIsOnline } from '@/features/home/availabilitySlice';

async function createUploadFormData(
  fields: Record<string, string | undefined>,
  fileField: { name: string; uri: string; mimeType: string; fileName: string; webFile?: any }
): Promise<FormData> {
  const formData = new FormData();
  Object.entries(fields).forEach(([k, v]) => {
    if (v !== undefined) formData.append(k, v);
  });

  if (Platform.OS === 'web') {
    if (fileField.webFile instanceof Blob || (typeof File !== 'undefined' && fileField.webFile instanceof File)) {
      formData.append(fileField.name, fileField.webFile, fileField.fileName || 'document.pdf');
      return formData;
    }
    if (fileField.uri) {
      try {
        const res = await fetch(fileField.uri);
        const blob = await res.blob();
        formData.append(fileField.name, blob, fileField.fileName || 'document.pdf');
        return formData;
      } catch (err) {
        console.warn('[Upload] Failed to convert URI to blob', err);
      }
    }
  }

  formData.append(fileField.name, {
    uri: fileField.uri,
    type: fileField.mimeType,
    name: fileField.fileName,
  } as unknown as Blob);
  return formData;
}

/**
 * Delivery RTK — P2-DEL-01…03.
 * No GET /delivery/me (GAP-API-08). No decline offer (GAP-API-10).
 */
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
    upsertDeliveryProfile: builder.mutation<
      DeliveryProfile,
      {
        fullName?: string;
        vehicleType?: string;
        vehicleNumber?: string;
        addressLine1?: string;
        addressLine2?: string;
        city?: string;
        state?: string;
        pincode?: string;
      }
    >({
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
      queryFn: async (args, _queryApi, _extraOptions, fetchWithBQ) => {
        try {
          const formData = await createUploadFormData(
            { docType: args.docType },
            {
              name: 'file',
              uri: args.uri,
              mimeType: args.mimeType,
              fileName: args.fileName,
              webFile: args.webFile,
            }
          );
          const result = await fetchWithBQ({
            url: `/api/v1/delivery/me/documents?docType=${encodeURIComponent(args.docType)}`,
            method: 'POST',
            body: formData,
          });
          if (result.error) return { error: result.error };
          return { data: result.data as DeliveryDocumentUploadResult };
        } catch (e: any) {
          return { error: { status: 'CUSTOM_ERROR', error: e.message } as any };
        }
      },
      invalidatesTags: [{ type: 'Delivery', id: 'DOCS' }, { type: 'Delivery', id: 'PROFILE' }],
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
    rejectAssignment: builder.mutation<void, string>({
      query: (assignmentId) => ({
        url: `/api/v1/delivery/assignments/${assignmentId}/reject`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {},
      }),
      invalidatesTags: (_result, _error, assignmentId) => [
        { type: 'Delivery', id: 'OFFERS' },
        { type: 'Delivery', id: `OFFER-${assignmentId}` },
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
          return { data: result.data as { profileImageKey: string; uploadedAt: string } };
        } catch (e: any) {
          return { error: { status: 'CUSTOM_ERROR', error: e.message } as any };
        }
      },
      invalidatesTags: [{ type: 'Delivery', id: 'PROFILE' }],
    }),
    verifyFace: builder.mutation<
      boolean,
      { assignmentId: string; uri: string; mimeType: string; fileName: string; webFile?: any }
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
            url: `/api/v1/delivery/assignments/${args.assignmentId}/verify-face`,
            method: 'POST',
            body: formData,
          });
          if (result.error) return { error: result.error };
          return { data: result.data as boolean };
        } catch (e: any) {
          return { error: { status: 'CUSTOM_ERROR', error: e.message } as any };
        }
      },
    }),
    verifyFaceForOnline: builder.mutation<
      boolean,
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
            url: '/api/v1/delivery/me/verify-face',
            method: 'POST',
            body: formData,
          });
          if (result.error) return { error: result.error };
          return { data: result.data as boolean };
        } catch (e: any) {
          return { error: { status: 'CUSTOM_ERROR', error: e.message } as any };
        }
      },
    }),
    getDeliveryBankDetails: builder.query<
      { accountHolderName: string; accountNumber: string; ifscCode: string; bankName: string },
      void
    >({
      query: () => '/api/v1/delivery/me/bank-details',
      providesTags: [{ type: 'Delivery', id: 'BANK_DETAILS' }],
    }),
    updateDeliveryBankDetails: builder.mutation<
      { accountHolderName: string; accountNumber: string; ifscCode: string; bankName: string },
      { accountHolderName: string; accountNumber: string; ifscCode: string; bankName: string }
    >({
      query: (body) => ({
        url: '/api/v1/delivery/me/bank-details',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'Delivery', id: 'BANK_DETAILS' }, { type: 'Delivery', id: 'PROFILE' }],
    }),
  }),
});

export const {
  useGetDeliveryProfileQuery,
  useUpsertDeliveryProfileMutation,
  useUploadDeliveryDocumentMutation,
  useSetAvailabilityMutation,
  useGetDeliveryOffersQuery,
  useAcceptAssignmentMutation,
  useRejectAssignmentMutation,
  useLocationPingMutation,
  useVerifyPickupOtpMutation,
  useVerifyDeliveryOtpMutation,
  useUploadDeliveryProfileImageMutation,
  useVerifyFaceMutation,
  useVerifyFaceForOnlineMutation,
  useGetDeliveryBankDetailsQuery,
  useUpdateDeliveryBankDetailsMutation,
} = deliveryApi;
