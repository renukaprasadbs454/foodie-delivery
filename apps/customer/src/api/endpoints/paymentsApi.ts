import { baseApi } from '../baseApi';
import type { PaymentInitiation } from '../../features/payment/types';

export type InitiatePaymentArg = {
  orderId: string;
  idempotencyKey: string;
};

/**
 * P2-CUS-05 — initiate Razorpay payment (empty body; Idempotency-Key header).
 * Never call webhook from the app.
 */
export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    initiatePayment: builder.mutation<PaymentInitiation, InitiatePaymentArg>({
      query: ({ orderId, idempotencyKey }) => ({
        url: `/api/v1/payments/orders/${orderId}/initiate`,
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
          'Content-Type': 'application/json',
        },
        body: {},
      }),
    }),
  }),
});

export const { useInitiatePaymentMutation } = paymentsApi;
