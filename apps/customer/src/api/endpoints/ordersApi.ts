import { baseApi } from '../baseApi';
import { resetMockCart } from './cartApi';
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
let mockOrderIdCounter = 1000;
const mockOrdersStore: Record<string, OrderDetail> = {};

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<Order, CreateOrderArg>({
      queryFn: (arg) => {
        mockOrderIdCounter++;
        const newId = `mock-ord-${mockOrderIdCounter}`;
        const newOrder: OrderDetail = {
          orderId: newId,
          orderNumber: `ORD-${mockOrderIdCounter}`,
          status: 'PREPARING', // automatically start at PREPARING for testing
          restaurantId: 'mock-resto-1',
          subtotal: 350,
          deliveryFee: 40,
          taxAmount: 18,
          discountAmount: 0,
          totalAmount: 408,
          placedAt: new Date().toISOString(),
          addressId: arg.addressId,
          items: [],
          orderStatusEvents: [],
        };
        mockOrdersStore[newId] = newOrder;

        // Compress Timeline:
        // 0s: PLACED
        // 1s: ACCEPTED
        setTimeout(() => {
          if (mockOrdersStore[newId]) mockOrdersStore[newId].status = 'ACCEPTED';
        }, 1000);

        // 3s: PREPARING
        setTimeout(() => {
          if (mockOrdersStore[newId]) mockOrdersStore[newId].status = 'PREPARING';
        }, 3000);

        // 6s: ASSIGNED
        setTimeout(() => {
          if (mockOrdersStore[newId]) mockOrdersStore[newId].status = 'ASSIGNED';
        }, 6000);

        // 10s: REACHED_RESTAURANT
        setTimeout(() => {
          if (mockOrdersStore[newId]) mockOrdersStore[newId].status = 'REACHED_RESTAURANT';
        }, 10000);

        // 13s: READY_FOR_PICKUP
        setTimeout(() => {
          if (mockOrdersStore[newId]) mockOrdersStore[newId].status = 'READY_FOR_PICKUP';
        }, 13000);

        // 16s: PICKED_UP
        setTimeout(() => {
          if (mockOrdersStore[newId]) mockOrdersStore[newId].status = 'PICKED_UP';
        }, 16000);

        // 20s: OUT_FOR_DELIVERY
        setTimeout(() => {
          if (mockOrdersStore[newId]) mockOrdersStore[newId].status = 'OUT_FOR_DELIVERY';
        }, 20000);

        // 25s: DELIVERED
        setTimeout(() => {
          if (mockOrdersStore[newId]) mockOrdersStore[newId].status = 'DELIVERED';
        }, 25000);

        // Reset the mock cart state so UI returns to empty
        resetMockCart();

        return { data: JSON.parse(JSON.stringify(newOrder)) };
      },
      invalidatesTags: [
        { type: 'Cart', id: 'CURRENT' },
        { type: 'Order', id: 'LIST' },
      ],
    }),
    getOrder: builder.query<OrderDetail, string>({
      queryFn: (orderId) => {
        if (!mockOrdersStore[orderId]) {
          // Standard fallback mock
          return {
            data: {
              orderId,
              orderNumber: orderId.toUpperCase(),
              status: 'PREPARING',
              restaurantId: 'mock-resto-1',
              subtotal: 100, deliveryFee: 20, taxAmount: 5, discountAmount: 0, totalAmount: 125,
              placedAt: new Date().toISOString(),
              addressId: 'mock',
              items: [], orderStatusEvents: []
            } as OrderDetail
          };
        }
        return { data: JSON.parse(JSON.stringify(mockOrdersStore[orderId])) };
      },
      providesTags: (_result, _error, orderId) => [
        { type: 'Order', id: orderId },
      ],
      keepUnusedDataFor: 90,
    }),
    getMyOrders: builder.query<OrderSummary[], MyOrdersParams>({
      queryFn: () => {
        return { data: JSON.parse(JSON.stringify(Object.values(mockOrdersStore))) };
      },
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
        queryFn: ({ orderId, targetStatus }) => {
          if (mockOrdersStore[orderId]) {
            mockOrdersStore[orderId].status = targetStatus;
          }
          return { data: JSON.parse(JSON.stringify(mockOrdersStore[orderId])) };
        },
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
