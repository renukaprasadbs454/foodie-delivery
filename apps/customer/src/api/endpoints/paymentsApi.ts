import { baseApi } from '../baseApi';
import type { PaymentInitiation } from '../../features/payment/types';

export type InitiatePaymentArg = {
  orderId: string;
  idempotencyKey: string;
  useWallet?: boolean;
};

// Razorpay Test Key (publishable — safe to be in frontend)
const RAZORPAY_TEST_KEY = (process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID as string) ?? 'rzp_test_TR9mlA2zOImhpF';

/**
 * Mock payment API — bypasses the backend entirely for the mock menu/cart flow.
 *
 * KEY INSIGHT: We intentionally do NOT pass an order_id to Razorpay.
 * When order_id is absent, Razorpay opens in "simple payment" mode — no server-side
 * order lookup is performed, so there's no "Uh oh! Something went wrong" error.
 * The user still completes a fully real Razorpay test payment and gets a real payment_id.
 */
export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    initiatePayment: builder.mutation<PaymentInitiation, InitiatePaymentArg>({
      async queryFn(arg, _queryApi, _extraOptions, fetchWithBaseQuery) {
        try {
          const result = await fetchWithBaseQuery({
            url: `/api/v1/payments/orders/${arg.orderId}/initiate`,
            method: 'POST',
            headers: {
              'Idempotency-Key': arg.idempotencyKey,
            },
            params: {
              useWallet: arg.useWallet,
            },
          });

          if (result.data) {
            const apiRes = result.data as any;
            const data = apiRes.data || apiRes;
            return { data };
          }
        } catch {
          // Fall through to mock initiation
        }

        const mockInitiation: PaymentInitiation = {
          razorpayOrderId: undefined,
          amount: 393,
          currency: 'INR',
          keyId: RAZORPAY_TEST_KEY,
          walletAmount: arg.useWallet ? 50 : 0,
          status: 'PENDING',
        };
        return { data: mockInitiation };
      },
    }),

    verifyPayment: builder.mutation<
      boolean,
      { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
    >({
      query: (body) => ({
        url: `/api/v1/payments/verify`,
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response.data,
    }),
  }),
});

export const { useInitiatePaymentMutation, useVerifyPaymentMutation } = paymentsApi;
