import { baseApi } from '../baseApi';
import type { FullMenu } from '../../features/menu/types';

/**
 * P2-CUS-02 — Customer menu GET (UI-API Menu / API §4.1).
 */
export const menuApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMenu: builder.query<FullMenu, string>({
      query: (restaurantId) => `/api/v1/menu/restaurants/${restaurantId}`,
      providesTags: (_result, _error, restaurantId) => [
        { type: 'Menu', id: restaurantId },
      ],
      keepUnusedDataFor: 150,
    }),
  }),
});

export const { useGetMenuQuery } = menuApi;
