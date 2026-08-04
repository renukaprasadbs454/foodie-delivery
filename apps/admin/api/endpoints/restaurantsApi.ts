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

/**
 * Restaurant RTK — P2-ADM-03 (detail + reviews + approve/suspend).
 * No admin list GET (GAP-API-14).
 */
export const restaurantsApi = baseApi.injectEndpoints({
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
    approveRestaurant: builder.mutation<RestaurantDetail, string>({
      query: (restaurantId) => ({
        url: `/api/bff/admin/restaurants/${restaurantId}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Restaurant', id },
        { type: 'Admin', id: 'RESTAURANT' },
      ],
    }),
    suspendRestaurant: builder.mutation<
      RestaurantDetail,
      { restaurantId: string; body: SuspendRestaurantBody }
    >({
      query: ({ restaurantId, body }) => ({
        url: `/api/bff/admin/restaurants/${restaurantId}/suspend`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Restaurant', id: arg.restaurantId },
        { type: 'Admin', id: 'RESTAURANT' },
      ],
    }),
  }),
});

export const {
  useGetRestaurantQuery,
  useGetRestaurantReviewsQuery,
  useApproveRestaurantMutation,
  useSuspendRestaurantMutation,
} = restaurantsApi;
