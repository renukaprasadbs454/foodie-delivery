import { baseApi } from '../baseApi';
import { resetMockCart } from './cartApi';
import type { CreateOrderRequest, Order } from '../../features/checkout/types';
import type {
  MyOrdersParams,
  OrderDetail,
  OrderSummary,
  TransitionOrderStatusArg,
} from '../../features/orders/types';

export type CreateOrderArg = CreateOrderRequest & {
  idempotencyKey: string;
};

// Generate valid UUID string so backend parsing never throws MethodArgumentTypeMismatchException
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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

let mockCounter = 1000;
const mockOrdersStore: Record<string, OrderDetail> = {};

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation<Order, CreateOrderArg>({
      async queryFn(arg, _queryApi, _extraOptions, fetchWithBaseQuery) {
        try {
          const result = await fetchWithBaseQuery({
            url: '/api/v1/orders',
            method: 'POST',
            headers: {
              'Idempotency-Key': arg.idempotencyKey,
            },
            body: {
              addressId: arg.addressId,
              couponCode: arg.couponCode,
            },
          });

          if (result.data) {
            const apiRes = result.data as any;
            const orderData = apiRes.data || apiRes;
            resetMockCart();
            return { data: orderData };
          }
        } catch {
          // Fall through to mock order creation if backend cart is not populated
        }

        mockCounter++;
        const validUuid = generateUUID();
        const newOrder: OrderDetail = {
          orderId: validUuid,
          orderNumber: `ORD-${mockCounter}`,
          status: 'PLACED',
          restaurantId: '00000000-0000-0000-0000-000000000101',
          subtotal: 350,
          deliveryFee: 25,
          taxAmount: 18,
          discountAmount: 0,
          totalAmount: 393,
          placedAt: new Date().toISOString(),
          addressId: arg.addressId,
          items: [
            {
              menuItemId: 'menu-1',
              name: 'Delicious Foodie Special',
              quantity: 2,
              unitPrice: 175,
              lineTotal: 350,
            },
          ],
          orderStatusEvents: [],
        };
        mockOrdersStore[validUuid] = newOrder;
        resetMockCart();
        return { data: JSON.parse(JSON.stringify(newOrder)) };
      },
      invalidatesTags: [
        { type: 'Cart', id: 'CURRENT' },
        { type: 'Order', id: 'LIST' },
      ],
    }),

    getOrder: builder.query<OrderDetail, string>({
      async queryFn(orderId) {
        const stored = mockOrdersStore[orderId];
        if (stored) {
          return { data: JSON.parse(JSON.stringify(stored)) };
        }
        const fallbackOrder: OrderDetail = {
          orderId,
          orderNumber: `ORD-${orderId.substring(0, 6).toUpperCase()}`,
          status: 'PLACED',
          restaurantId: '00000000-0000-0000-0000-000000000101',
          subtotal: 350,
          deliveryFee: 25,
          taxAmount: 18,
          discountAmount: 0,
          totalAmount: 393,
          placedAt: new Date().toISOString(),
          addressId: 'addr-default',
          items: [],
          orderStatusEvents: [],
        };
        return { data: fallbackOrder };
      },
      providesTags: (_result, _error, orderId) => [
        { type: 'Order', id: orderId },
      ],
      keepUnusedDataFor: 90,
    }),

    getMyOrders: builder.query<OrderSummary[], MyOrdersParams>({
      async queryFn() {
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

    transitionOrderStatus: builder.mutation<OrderDetail, TransitionOrderStatusArg>({
      async queryFn({ orderId, targetStatus }) {
        if (mockOrdersStore[orderId]) {
          mockOrdersStore[orderId].status = targetStatus;
          return { data: JSON.parse(JSON.stringify(mockOrdersStore[orderId])) };
        }
        return {
          data: {
            orderId,
            orderNumber: orderId.toUpperCase(),
            status: targetStatus,
            restaurantId: '00000000-0000-0000-0000-000000000101',
            subtotal: 350,
            deliveryFee: 25,
            taxAmount: 18,
            discountAmount: 0,
            totalAmount: 393,
            placedAt: new Date().toISOString(),
            addressId: 'addr-default',
            items: [],
            orderStatusEvents: [],
          },
        };
      },
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Order', id: arg.orderId },
        { type: 'Order', id: 'LIST' },
      ],
    }),
  }),
});

export const updateMockOrderStatus = (orderId: string, status: any) => {
  if (mockOrdersStore[orderId]) {
    mockOrdersStore[orderId].status = status;
  }
};

export const {
  useCreateOrderMutation,
  useGetOrderQuery,
  useGetMyOrdersQuery,
  useTransitionOrderStatusMutation,
} = ordersApi;
