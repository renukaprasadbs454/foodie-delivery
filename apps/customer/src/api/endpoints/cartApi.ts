import { baseApi } from '../baseApi';
import type { AddCartItemRequest, Cart, CartItem } from '../../features/menu/types';
import { parseMoney } from '../../features/menu/types';

export type AddCartItemArg = AddCartItemRequest & {
  name?: string;
  optimisticUnitPrice?: number;
};

let mockCart: Cart = { cartId: 'mock-cart', restaurantId: null, items: [], subtotal: 0 };
export const resetMockCart = () => { mockCart = { cartId: 'mock-cart', restaurantId: null, items: [], subtotal: 0 }; };

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query<Cart, void>({
      queryFn: () => ({ data: JSON.parse(JSON.stringify(mockCart)) }),
      providesTags: [{ type: 'Cart', id: 'CURRENT' }],
      keepUnusedDataFor: 30,
    }),
    addCartItem: builder.mutation<Cart, AddCartItemArg>({
      queryFn: (arg) => {
        const rId = arg.menuItemId.split('-item-')[0]; // Mock extraction 
        if (!mockCart.restaurantId) mockCart.restaurantId = rId;

        const variantKey = arg.variantId ?? null;
        const existing = mockCart.items.find(
          (item) => item.menuItemId === arg.menuItemId && (item.variantId ?? null) === variantKey
        );
        if (existing) {
          existing.quantity += arg.quantity;
          if (arg.name) existing.name = arg.name;
          if (arg.notes != null) existing.notes = arg.notes;
          const unit = parseMoney(existing.unitPrice);
          existing.lineTotal = unit * existing.quantity;
        } else {
          const unit = arg.optimisticUnitPrice ?? 150;
          const provisional: CartItem = {
            cartItemId: `optimistic-${arg.menuItemId}-${variantKey ?? 'base'}`,
            menuItemId: arg.menuItemId,
            name: arg.name,
            variantId: variantKey,
            quantity: arg.quantity,
            notes: arg.notes ?? null,
            unitPrice: unit,
            lineTotal: unit * arg.quantity,
          };
          mockCart.items.push(provisional);
        }
        mockCart.subtotal = mockCart.items.reduce((sum, item) => sum + parseMoney(item.lineTotal), 0);
        return { data: JSON.parse(JSON.stringify(mockCart)) };
      },
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    updateCartItemQuantity: builder.mutation<Cart, { cartItemId: string; quantity: number }>({
      queryFn: ({ cartItemId, quantity }) => {
        const item = mockCart.items.find((i) => i.cartItemId === cartItemId);
        if (item) {
          item.quantity = quantity;
          item.lineTotal = parseMoney(item.unitPrice) * quantity;
          mockCart.subtotal = mockCart.items.reduce((sum, i) => sum + parseMoney(i.lineTotal), 0);
        }
        return { data: JSON.parse(JSON.stringify(mockCart)) };
      },
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    removeCartItem: builder.mutation<Cart, string>({
      queryFn: (cartItemId) => {
        mockCart.items = mockCart.items.filter((item) => item.cartItemId !== cartItemId);
        if (mockCart.items.length === 0) {
          mockCart.restaurantId = null;
          mockCart.subtotal = 0;
        } else {
          mockCart.subtotal = mockCart.items.reduce((sum, item) => sum + parseMoney(item.lineTotal), 0);
        }
        return { data: JSON.parse(JSON.stringify(mockCart)) };
      },
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    clearCart: builder.mutation<null, void>({
      queryFn: () => {
        mockCart = { cartId: 'mock-cart', restaurantId: null, items: [], subtotal: 0 };
        return { data: null };
      },
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
  }),
});

export const { useGetCartQuery, useAddCartItemMutation, useUpdateCartItemQuantityMutation, useRemoveCartItemMutation, useClearCartMutation } = cartApi;
