import { baseApi } from '../baseApi';
import type { RestaurantLocation } from '../../features/profile/location/locationTypes';

export const locationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRestaurantLocation: builder.query<RestaurantLocation, void>({
      query: () => '/api/v1/restaurants/me/location',
      providesTags: [{ type: 'Restaurant', id: 'LOCATION' }],
      keepUnusedDataFor: 120,
    }),
    updateRestaurantLocation: builder.mutation<RestaurantLocation, RestaurantLocation>({
      query: (body) => ({
        url: '/api/v1/restaurants/me/location',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'Restaurant', id: 'LOCATION' }],
    }),
  }),
});

export const {
  useGetRestaurantLocationQuery,
  useUpdateRestaurantLocationMutation,
} = locationApi;
