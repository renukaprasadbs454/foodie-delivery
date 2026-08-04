import { baseApi } from '../baseApi';
import type {
  DeliveryDocType,
  DeliveryDocumentUploadResult,
} from '../../features/kyc/types';
import type {
  AvailabilityState,
  DeliveryAssignment,
  DeliveryOffer,
} from '../../features/home/types';
import { normalizeOffers } from '../../features/home/types';
import type { LocationPingPayload } from '../../features/navigation/types';

/**
 * Delivery RTK — P2-DEL-01…03.
 * No GET /delivery/me (GAP-API-08). No decline offer (GAP-API-10).
 */
export const deliveryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    uploadDeliveryDocument: builder.mutation<
      DeliveryDocumentUploadResult,
      {
        docType: DeliveryDocType;
        uri: string;
        mimeType: string;
        fileName: string;
      }
    >({
      query: ({ docType, uri, mimeType, fileName }) => {
        const formData = new FormData();
        formData.append('docType', docType);
        formData.append('file', {
          uri,
          type: mimeType,
          name: fileName,
        } as unknown as Blob);
        return {
          url: '/api/v1/delivery/me/documents',
          method: 'POST',
          body: formData,
        };
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
        invalidatesTags: [{ type: 'Delivery', id: 'AVAILABILITY' }],
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
  }),
});

export const {
  useUploadDeliveryDocumentMutation,
  useSetAvailabilityMutation,
  useGetDeliveryOffersQuery,
  useAcceptAssignmentMutation,
  useLocationPingMutation,
  useVerifyPickupOtpMutation,
  useVerifyDeliveryOtpMutation,
} = deliveryApi;
