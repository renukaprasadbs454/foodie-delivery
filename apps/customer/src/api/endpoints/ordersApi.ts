import { baseApi } from '../baseApi';
import type { CreateOrderRequest, Order } from '../../features/checkout/types';
import type {
  MyOrdersParams,
  OrderDetail,
  OrderSummary,
  TransitionOrderStatusArg,
} from '../../features/orders/types';
import {
  DEFAULT_ORDERS_PAGE_SIZE,
  isOrderSort,
} from '../../features/orders/types';

export type CreateOrderArg = CreateOrderRequest & {
  idempotencyKey: string;
};

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
 * Orders RTK — P2-CUS-04 create; P2-CUS-05 getOrder; P2-CUS-06 list/transition.
 */
export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<Order, CreateOrderArg>({
      query: ({ addressId, couponCode, idempotencyKey }) => ({
        url: '/api/v1/orders',
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
          'Content-Type': 'application/json',
        },
        body: {
          addressId,
          couponCode: couponCode?.trim() ? couponCode.trim() : null,
        },
      }),
      invalidatesTags: [
        { type: 'Cart', id: 'CURRENT' },
        { type: 'Order', id: 'LIST' },
      ],
    }),
    getOrder: builder.query<OrderDetail, string>({
      query: (orderId) => `/api/v1/orders/${orderId}`,
      providesTags: (_result, _error, orderId) => [
        { type: 'Order', id: orderId },
      ],
      keepUnusedDataFor: 90,
    }),
    getMyOrders: builder.query<OrderSummary[], MyOrdersParams>({
      query: ({
        status,
        page = 0,
        size = DEFAULT_ORDERS_PAGE_SIZE,
        sort = 'placedAt',
      }) => ({
        url: '/api/v1/orders/me',
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
      keepUnusedDataFor: 90,
    }),
    transitionOrderStatus: builder.mutation<OrderDetail, TransitionOrderStatusArg>(
      {
        query: ({ orderId, targetStatus, reason }) => ({
          url: `/api/v1/orders/${orderId}/status`,
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: { targetStatus, reason },
        }),
        invalidatesTags: (_result, _error, arg) => [
          { type: 'Order', id: arg.orderId },
          { type: 'Order', id: 'LIST' },
        ],
      },
    ),
  }),
});

export const {
  useCreateOrderMutation,
  useGetOrderQuery,
  useGetMyOrdersQuery,
  useTransitionOrderStatusMutation,
} = ordersApi;
