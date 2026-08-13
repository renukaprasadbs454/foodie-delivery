import { baseApi } from '../baseApi';
import type {
  AddVariantRequest,
  CreateCategoryRequest,
  CreateMenuItemRequest,
  FullMenu,
  MenuCategory,
  MenuItem,
  MenuVariant,
  UpdateMenuItemRequest,
} from '../../features/menu/types';

/**
 * Restaurant menu RTK — P2-RES-03.
 * Create, update, delete, availability, image, variant operations.
 */
export const menuApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMenu: builder.query<FullMenu, string>({
      query: (restaurantId) => `/api/v1/menu/restaurants/${restaurantId}`,
      providesTags: (_result, _error, restaurantId) => [
        { type: 'Menu', id: restaurantId },
        { type: 'Menu', id: 'LIST' },
      ],
      keepUnusedDataFor: 120,
    }),
    createCategory: builder.mutation<
      Pick<MenuCategory, 'categoryId' | 'name' | 'displayOrder'>,
      CreateCategoryRequest
    >({
      query: (body) => ({
        url: '/api/v1/menu/categories',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          name: body.name,
          displayOrder: body.displayOrder ?? 0,
        },
      }),
      invalidatesTags: [{ type: 'Menu', id: 'LIST' }],
    }),
    createMenuItem: builder.mutation<
      Omit<MenuItem, 'variants'> & { categoryId: string },
      CreateMenuItemRequest
    >({
      query: (body) => ({
        url: '/api/v1/menu/items',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          categoryId: body.categoryId,
          name: body.name,
          description: body.description ?? null,
          basePrice: body.basePrice,
          isVeg: body.isVeg,
        },
      }),
      invalidatesTags: [{ type: 'Menu', id: 'LIST' }],
    }),
    updateMenuItem: builder.mutation<
      Omit<MenuItem, 'variants'> & { categoryId: string },
      UpdateMenuItemRequest
    >({
      query: ({ menuItemId, categoryId, name, description, basePrice, isVeg }) => ({
        url: `/api/v1/menu/items/${menuItemId}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: {
          categoryId,
          name,
          description: description ?? null,
          basePrice,
          isVeg,
        },
      }),
      invalidatesTags: [{ type: 'Menu', id: 'LIST' }],
    }),
    deleteMenuItem: builder.mutation<void, string>({
      query: (menuItemId) => ({
        url: `/api/v1/menu/items/${menuItemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Menu', id: 'LIST' }],
    }),
    updateItemAvailability: builder.mutation<
      { menuItemId: string; isAvailable: boolean },
      { menuItemId: string; isAvailable: boolean; restaurantId: string }
    >({
      query: ({ menuItemId, isAvailable }) => ({
        url: `/api/v1/menu/items/${menuItemId}/availability`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: { isAvailable },
      }),
      async onQueryStarted(
        { menuItemId, isAvailable, restaurantId },
        { dispatch, queryFulfilled },
      ) {
        const patch = dispatch(
          menuApi.util.updateQueryData('getMenu', restaurantId, (draft) => {
            for (const category of draft.categories) {
              const item = category.items.find(
                (i) => i.menuItemId === menuItemId,
              );
              if (item) {
                item.isAvailable = isAvailable;
                break;
              }
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: [{ type: 'Menu', id: 'LIST' }],
    }),
    uploadMenuItemImage: builder.mutation<
      { fileKey: string; uploadedAt?: string },
      {
        menuItemId: string;
        uri: string;
        mimeType: string;
        fileName: string;
      }
    >({
      query: ({ menuItemId, uri, mimeType, fileName }) => {
        const formData = new FormData();
        formData.append('file', {
          uri,
          type: mimeType,
          name: fileName,
        } as unknown as Blob);
        return {
          url: `/api/v1/menu/items/${menuItemId}/image`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [{ type: 'Menu', id: 'LIST' }],
    }),
    addVariant: builder.mutation<
      MenuVariant,
      { menuItemId: string } & AddVariantRequest
    >({
      query: ({ menuItemId, name, priceDelta }) => ({
        url: `/api/v1/menu/items/${menuItemId}/variants`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { name, priceDelta },
      }),
      invalidatesTags: [{ type: 'Menu', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetMenuQuery,
  useCreateCategoryMutation,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useUpdateItemAvailabilityMutation,
  useUploadMenuItemImageMutation,
  useAddVariantMutation,
} = menuApi;
