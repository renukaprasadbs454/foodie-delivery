import { baseApi } from '../baseApi';
import type {
  AddCartItemRequest,
  Cart,
  CartItem,
} from '../../features/menu/types';
import { parseMoney } from '../../features/menu/types';

export type AddCartItemArg = AddCartItemRequest & {
  /** Display-only unit for optimistic line; server response is authoritative. */
  optimisticUnitPrice?: number;
};

/**
 * Cart RTK — P2-CUS-02 (get/add/clear for Menu) + P2-CUS-03 (remove + Cart UI).
 */
export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCart: builder.query<Cart, void>({
      query: () => '/api/v1/cart',
      providesTags: [{ type: 'Cart', id: 'CURRENT' }],
      keepUnusedDataFor: 30,
    }),
    addCartItem: builder.mutation<Cart, AddCartItemArg>({
      query: ({ menuItemId, variantId, quantity, notes }) => ({
        url: '/api/v1/cart/items',
        method: 'POST',
        body: {
          menuItemId,
          variantId: variantId ?? null,
          quantity,
          notes: notes?.length ? notes : null,
        },
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          cartApi.util.updateQueryData('getCart', undefined, (draft) => {
            applyOptimisticAdd(draft, arg);
          }),
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(
            cartApi.util.updateQueryData('getCart', undefined, () => data),
          );
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    removeCartItem: builder.mutation<Cart, string>({
      query: (cartItemId) => ({
        url: `/api/v1/cart/items/${cartItemId}`,
        method: 'DELETE',
      }),
      async onQueryStarted(cartItemId, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          cartApi.util.updateQueryData('getCart', undefined, (draft) => {
            applyOptimisticRemove(draft, cartItemId);
          }),
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(
            cartApi.util.updateQueryData('getCart', undefined, () => data),
          );
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
    clearCart: builder.mutation<null, void>({
      query: () => ({
        url: '/api/v1/cart',
        method: 'DELETE',
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          cartApi.util.updateQueryData('getCart', undefined, (draft) => {
            draft.items = [];
            draft.restaurantId = null;
            draft.subtotal = 0;
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patch.undo();
        }
      },
      invalidatesTags: [{ type: 'Cart', id: 'CURRENT' }],
    }),
  }),
});

function applyOptimisticAdd(draft: Cart, arg: AddCartItemArg): void {
  const variantKey = arg.variantId ?? null;
  const existing = draft.items.find(
    (item) =>
      item.menuItemId === arg.menuItemId &&
      (item.variantId ?? null) === variantKey,
  );
  if (existing) {
    existing.quantity += arg.quantity;
    if (arg.notes != null) existing.notes = arg.notes;
    const unit = parseMoney(existing.unitPrice);
    existing.lineTotal = unit * existing.quantity;
  } else {
    const unit = arg.optimisticUnitPrice ?? 0;
    const provisional: CartItem = {
      cartItemId: `optimistic-${arg.menuItemId}-${variantKey ?? 'base'}`,
      menuItemId: arg.menuItemId,
      variantId: variantKey,
      quantity: arg.quantity,
      notes: arg.notes ?? null,
      unitPrice: unit,
      lineTotal: unit * arg.quantity,
    };
    draft.items.push(provisional);
  }
  draft.subtotal = draft.items.reduce(
    (sum, item) => sum + parseMoney(item.lineTotal),
    0,
  );
}

function applyOptimisticRemove(draft: Cart, cartItemId: string): void {
  draft.items = draft.items.filter((item) => item.cartItemId !== cartItemId);
  if (draft.items.length === 0) {
    draft.restaurantId = null;
    draft.subtotal = 0;
    return;
  }
  draft.subtotal = draft.items.reduce(
    (sum, item) => sum + parseMoney(item.lineTotal),
    0,
  );
}

export const {
  useGetCartQuery,
  useAddCartItemMutation,
  useRemoveCartItemMutation,
  useClearCartMutation,
} = cartApi;
