import { baseApi } from '../baseApi';
import type {
  OrderDetail,
  OrderSummary,
  RestaurantOrdersParams,
  TransitionOrderStatusArg,
} from '../../features/orders/types';
import {
  DEFAULT_ORDERS_PAGE_SIZE,
  isOrderSort,
} from '../../features/orders/types';

function normalizeOrderList(data: unknown): OrderSummary[] {
  if (Array.isArray(data)) return data as OrderSummary[];
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { content?: unknown }).content)
  ) {
    return (data as { content: OrderSummary[] }).content;
  }
  return [];
}

/**
 * Restaurant orders RTK — P2-RES-02.
 * GET /orders/restaurant has no restaurantId query (JWT resolves restaurant).
 */
export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRestaurantOrders: builder.query<OrderSummary[], RestaurantOrdersParams>({
      query: ({
        status,
        page = 0,
        size = DEFAULT_ORDERS_PAGE_SIZE,
        sort = 'placedAt',
      }) => ({
        url: '/api/v1/orders/restaurant',
        params: {
          ...(status ? { status } : {}),
          page,
          size: Math.min(size, 100),
          ...(sort && isOrderSort(sort) ? { sort } : { sort: 'placedAt' }),
        },
      }),
      transformResponse: (response: unknown) => normalizeOrderList(response),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ orderId }) => ({
                type: 'Order' as const,
                id: orderId,
              })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
      keepUnusedDataFor: 45,
    }),
    getOrder: builder.query<OrderDetail, string>({
      query: (orderId) => `/api/v1/orders/${orderId}`,
      providesTags: (_result, _error, orderId) => [
        { type: 'Order', id: orderId },
      ],
      keepUnusedDataFor: 45,
    }),
    transitionOrderStatus: builder.mutation<
      OrderDetail,
      TransitionOrderStatusArg
    >({
      query: ({ orderId, targetStatus, reason }) => ({
        url: `/api/v1/orders/${orderId}/status`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: {
          targetStatus,
          reason: reason ?? null,
        },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Order', id: arg.orderId },
        { type: 'Order', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetRestaurantOrdersQuery,
  useGetOrderQuery,
  useTransitionOrderStatusMutation,
} = ordersApi;
