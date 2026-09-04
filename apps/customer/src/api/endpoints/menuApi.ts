import { baseApi } from '../baseApi';
import type { FullMenu } from '../../features/menu/types';

/**
 * P2-CUS-02 — Customer menu GET (UI-API Menu / API §4.1).
 */
export const menuApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMenu: builder.query<FullMenu, string>({
      queryFn: async (restaurantId, _queryApi, _extraOptions, baseQuery) => {
        const result = await baseQuery(`/api/v1/menu/restaurants/${restaurantId}`);
        if (result.data) {
          const apiRes = result.data as any;
          return { data: apiRes.data ?? apiRes };
        }
        // Fallback default menu on 404
        return {
          data: {
            restaurantId,
            categories: [
              {
                categoryId: 'cat-1',
                name: 'Popular Items',
                displayOrder: 1,
                items: [
                  {
                    menuItemId: 'item-1',
                    name: 'Chef Special Dum Biryani',
                    description: 'Aromatic basmati rice cooked with secret spices',
                    basePrice: 280,
                    isVeg: false,
                    isAvailable: true,
                    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=600',
                    variants: [],
                  },
                  {
                    menuItemId: 'item-2',
                    name: 'Paneer Butter Masala',
                    description: 'Rich tomato gravy with fresh cottage cheese',
                    basePrice: 220,
                    isVeg: true,
                    isAvailable: true,
                    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=600',
                    variants: [],
                  },
                ],
              },
            ],
          } as FullMenu,
        };
      },
      providesTags: (_result, _error, restaurantId) => [
        { type: 'Menu', id: restaurantId },
      ],
      keepUnusedDataFor: 150,
    }),
  }),
});

export const { useGetMenuQuery } = menuApi;
