import { baseApi } from '../baseApi';
import type {
  RestaurantListParams,
  RestaurantPublicProfile,
  RestaurantReview,
  RestaurantReviewsParams,
  RestaurantSummary,
} from '../../features/restaurants/types';
import { DEFAULT_RESTAURANT_PAGE_SIZE } from '../../features/restaurants/types';

export { hasMoreRestaurantPages } from '../../features/restaurants/types';

/**
 * P2-CUS-01 — Customer restaurant browse endpoints (UI-API Home/Listing/Search/Details).
 * Pagination: createBaseApi unwraps `data` only; end-of-list when page length < size
 * (Foundation residual until envelope meta.pagination is preserved).
 */

function normalizeRestaurantList(data: unknown): RestaurantSummary[] {
  if (Array.isArray(data)) return data as RestaurantSummary[];
  if (data && typeof data === 'object' && Array.isArray((data as { content?: unknown }).content)) {
    return (data as { content: RestaurantSummary[] }).content;
  }
  return [];
}

function normalizeReviewList(data: unknown): RestaurantReview[] {
  if (Array.isArray(data)) return data as RestaurantReview[];
  if (data && typeof data === 'object' && Array.isArray((data as { content?: unknown }).content)) {
    return (data as { content: RestaurantReview[] }).content;
  }
  return [];
}

export const restaurantsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRestaurants: builder.query<RestaurantSummary[], RestaurantListParams>({
      query: ({
        search,
        lat,
        lng,
        cuisineType,
        page = 0,
        size = DEFAULT_RESTAURANT_PAGE_SIZE,
        sort,
      }) => ({
        url: '/api/v1/restaurants',
        params: {
          ...(search ? { search } : {}),
          ...(lat !== undefined ? { lat } : {}),
          ...(lng !== undefined ? { lng } : {}),
          ...(cuisineType ? { cuisineType } : {}),
          page,
          size: Math.min(size, 100),
          ...(sort ? { sort } : {}),
        },
      }),
      transformResponse: (response: unknown) => normalizeRestaurantList(response),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Restaurant' as const, id })),
              { type: 'Restaurant', id: 'LIST' },
            ]
          : [{ type: 'Restaurant', id: 'LIST' }],
      keepUnusedDataFor: 150,
    }),
    getRestaurant: builder.query<RestaurantPublicProfile, string>({
      query: (restaurantId) => `/api/v1/restaurants/${restaurantId}`,
      providesTags: (_result, _error, id) => [{ type: 'Restaurant', id }],
      keepUnusedDataFor: 150,
    }),
    getRestaurantReviews: builder.query<
      RestaurantReview[],
      RestaurantReviewsParams
    >({
      query: ({
        restaurantId,
        page = 0,
        size = DEFAULT_RESTAURANT_PAGE_SIZE,
        sort = 'createdAt',
      }) => ({
        url: `/api/v1/restaurants/${restaurantId}/reviews`,
        params: {
          page,
          size: Math.min(size, 100),
          sort,
        },
      }),
      transformResponse: (response: unknown) => normalizeReviewList(response),
      providesTags: (_result, _error, arg) => [
        { type: 'Review', id: `LIST-${arg.restaurantId}` },
      ],
      keepUnusedDataFor: 120,
    }),
  }),
});

export const {
  useGetRestaurantsQuery,
  useLazyGetRestaurantsQuery,
  useGetRestaurantQuery,
  useGetRestaurantReviewsQuery,
} = restaurantsApi;
