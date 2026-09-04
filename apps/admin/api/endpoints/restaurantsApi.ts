import { baseApi } from '../baseApi';
import type {
  RestaurantDetail,
  RestaurantReview,
  SuspendRestaurantBody,
} from '../../features/restaurants/types';

function normalizeReviewList(data: unknown): RestaurantReview[] {
  if (Array.isArray(data)) return data as RestaurantReview[];
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { content?: unknown }).content)
  ) {
    return (data as { content: RestaurantReview[] }).content;
  }
  return [];
}

export interface DocumentVerificationInfo {
  docType: 'FSSAI' | 'GST' | 'PAN';
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documentNumber?: string;
  fileKey?: string;
  fileUrl?: string;
  documentUrl?: string;
  reason?: string;
  rejectionReason?: string;
  verifiedAt?: string;
}

export interface RestaurantApplicationDetail {
  id: string;
  restaurantId?: string;
  name: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  phone?: string;
  email?: string;
  address?: any;
  formattedAddress?: string;
  city: string;
  status: 'PENDING' | 'PENDING_ADMIN_APPROVAL' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  submittedAt: string;
  documents: DocumentVerificationInfo[];
  commissionPct?: number;
  legalName?: string;
  fssaiLicenseNumber?: string;
  gstin?: string;
  panNumber?: string;
  logoImageUrl?: string;
  coverImageUrl?: string;
}

export interface RestaurantApplicationsResponse {
  content: RestaurantApplicationDetail[];
  totalElements: number;
  totalPages: number;
}

/**
 * Restaurant RTK — P2-ADM-03 (detail + reviews + approve/suspend/applications).
 */
export const restaurantsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getRestaurant: builder.query<RestaurantDetail, string>({
      query: (restaurantId) => `/api/bff/restaurants/${restaurantId}`,
      providesTags: (_result, _error, id) => [
        { type: 'Restaurant', id },
        { type: 'Admin', id: 'RESTAURANT' },
      ],
      keepUnusedDataFor: 60,
    }),
    getRestaurantReviews: builder.query<
      RestaurantReview[],
      { restaurantId: string; page?: number; size?: number; sort?: string }
    >({
      query: ({ restaurantId, page = 0, size = 20, sort }) => ({
        url: `/api/bff/restaurants/${restaurantId}/reviews`,
        params: {
          page,
          size,
          ...(sort ? { sort } : {}),
        },
      }),
      transformResponse: (response: unknown) => normalizeReviewList(response),
      providesTags: (_result, _error, arg) => [
        { type: 'Review', id: arg.restaurantId },
      ],
      keepUnusedDataFor: 60,
    }),
    getPendingApplications: builder.query<
      RestaurantApplicationsResponse,
      { status?: string; page?: number; size?: number }
    >({
      query: ({ status, page = 0, size = 50 }) => ({
        url: '/api/v1/admin/restaurants/applications',
        params: { ...(status ? { status } : {}), page, size },
      }),
      transformResponse: (res: any) => res?.data || res,
      providesTags: [{ type: 'Admin', id: 'RESTAURANTS' }],
    }),
    getApplicationDetail: builder.query<RestaurantApplicationDetail, string>({
      query: (id) => `/api/v1/admin/restaurants/applications/${id}`,
      transformResponse: (res: any) => res?.data || res,
      providesTags: (_res, _err, id) => [{ type: 'Restaurant', id }],
    }),
    verifyDocument: builder.mutation<
      RestaurantApplicationDetail,
      { restaurantId: string; docType: 'FSSAI' | 'GST' | 'PAN'; status: 'VERIFIED' | 'REJECTED'; reason?: string }
    >({
      query: ({ restaurantId, docType, status, reason }) => ({
        url: `/api/v1/admin/restaurants/${restaurantId}/documents/verify`,
        method: 'POST',
        body: { docType, status, reason },
      }),
      transformResponse: (res: any) => res?.data || res,
      invalidatesTags: [{ type: 'Admin', id: 'RESTAURANTS' }],
    }),
    requestChanges: builder.mutation<RestaurantApplicationDetail, { restaurantId: string; reason: string }>({
      query: ({ restaurantId, reason }) => ({
        url: `/api/v1/admin/restaurants/${restaurantId}/request-changes`,
        method: 'POST',
        body: { reason },
      }),
      transformResponse: (res: any) => res?.data || res,
      invalidatesTags: [{ type: 'Admin', id: 'RESTAURANTS' }],
    }),
    approveRestaurant: builder.mutation<RestaurantDetail, string>({
      query: (restaurantId) => ({
        url: `/api/v1/admin/restaurants/${restaurantId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Restaurant', id },
        { type: 'Admin', id: 'RESTAURANTS' },
      ],
    }),
    rejectRestaurant: builder.mutation<RestaurantApplicationDetail, { restaurantId: string; reason: string }>({
      query: ({ restaurantId, reason }) => ({
        url: `/api/v1/admin/restaurants/${restaurantId}/reject`,
        method: 'POST',
        body: { reason },
      }),
      transformResponse: (res: any) => res?.data || res,
      invalidatesTags: [{ type: 'Admin', id: 'RESTAURANTS' }],
    }),
    suspendRestaurant: builder.mutation<
      RestaurantDetail,
      { restaurantId: string; body: SuspendRestaurantBody }
    >({
      query: ({ restaurantId, body }) => ({
        url: `/api/v1/admin/restaurants/${restaurantId}/suspend`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Restaurant', id: arg.restaurantId },
        { type: 'Admin', id: 'RESTAURANTS' },
      ],
    }),
  }),
});

export const {
  useGetRestaurantQuery,
  useGetRestaurantReviewsQuery,
  useGetPendingApplicationsQuery,
  useGetApplicationDetailQuery,
  useVerifyDocumentMutation,
  useRequestChangesMutation,
  useApproveRestaurantMutation,
  useRejectRestaurantMutation,
  useSuspendRestaurantMutation,
} = restaurantsApi;
