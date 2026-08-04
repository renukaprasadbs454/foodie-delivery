import { baseApi } from '../baseApi';
import type {
  RefundInitiation,
  RefundPaymentBody,
} from '../../features/payments/types';

/**
 * Payments RTK — P2-ADM-04 refund only.
 * No payments/settlements list GET (GAP-API-17). Never call webhooks from UI.
 */
export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    refundPayment: builder.mutation<
      RefundInitiation,
      { paymentId: string; body: RefundPaymentBody }
    >({
      query: ({ paymentId, body }) => ({
        url: `/api/bff/payments/${paymentId}/refund`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Payment', id: 'LIST' },
        { type: 'Order', id: 'LIST' },
      ],
    }),
  }),
});

export const { useRefundPaymentMutation } = paymentsApi;
