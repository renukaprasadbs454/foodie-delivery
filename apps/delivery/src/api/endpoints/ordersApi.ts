import { baseApi } from '../baseApi';
import type { OrderDetail } from '../../features/home/types';

/**
 * Orders RTK — P2-DEL-02 Assignment Details (GET /orders/{id} §6.2).
 * No GET /delivery/assignments/{id} (GAP-API-12).
 */
export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrder: builder.query<OrderDetail, string>({
      query: (orderId) => `/api/v1/orders/${orderId}`,
      providesTags: (_result, _error, orderId) => [
        { type: 'Order', id: orderId },
      ],
      keepUnusedDataFor: 45,
    }),
  }),
});

export const { useGetOrderQuery } = ordersApi;
