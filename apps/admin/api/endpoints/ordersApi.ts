import { baseApi } from '../baseApi';
import type {
  AdminOrder,
  OverrideOrderStatusBody,
} from '../../features/orders/types';

/**
 * Orders RTK — P2-ADM-04 (GET by id + admin override-status).
 * No admin order list GET (GAP-API-16).
 */
export const ordersApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getOrder: builder.query<AdminOrder, string>({
      query: (orderId) => `/api/bff/orders/${orderId}`,
      providesTags: (_result, _error, id) => [
        { type: 'Order', id },
        { type: 'Admin', id: 'ORDER' },
      ],
      keepUnusedDataFor: 60,
    }),
    overrideOrderStatus: builder.mutation<
      AdminOrder,
      { orderId: string; body: OverrideOrderStatusBody }
    >({
      query: ({ orderId, body }) => ({
        url: `/api/bff/admin/orders/${orderId}/override-status`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Order', id: arg.orderId },
        { type: 'Admin', id: 'ORDER' },
      ],
    }),
  }),
});

export const { useGetOrderQuery, useOverrideOrderStatusMutation } = ordersApi;
