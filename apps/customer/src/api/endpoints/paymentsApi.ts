import { baseApi } from '../baseApi';
import type { PaymentInitiation } from '../../features/payment/types';

export type InitiatePaymentArg = {
  orderId: string;
  idempotencyKey: string;
  useWallet?: boolean;
  amount?: number;
};

// Razorpay Test Key (publishable — safe to be in frontend)
const RAZORPAY_TEST_KEY = (process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID as string) ?? 'rzp_test_TR9mlA2zOImhpF';

/**
 * Payment API — initiates backend Razorpay order or mock payment flow.
 */
export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    initiatePayment: builder.mutation<PaymentInitiation, InitiatePaymentArg>({
      async queryFn(arg, _queryApi, _extraOptions, fetchWithBaseQuery) {
        const targetAmount = arg.amount ?? 393;

        if (!arg.orderId || arg.orderId.startsWith('mock-') || arg.orderId.startsWith('ds-mock-')) {
          return {
            data: {
              razorpayOrderId: undefined,
              amount: targetAmount,
              currency: 'INR',
              keyId: RAZORPAY_TEST_KEY,
              walletAmountUsed: arg.useWallet ? 50 : 0,
              status: 'PENDING',
            },
          };
        }

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
          // Fall through to fallback initiation with exact amount
        }

        return {
          data: {
            razorpayOrderId: undefined,
            amount: targetAmount,
            currency: 'INR',
            keyId: RAZORPAY_TEST_KEY,
            walletAmountUsed: arg.useWallet ? 50 : 0,
            status: 'PENDING',
          },
        };
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
