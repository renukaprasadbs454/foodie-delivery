import { baseApi } from '../baseApi';
import type { PaymentInitiation } from '../../features/payment/types';

export type InitiatePaymentArg = {
  orderId: string;
  idempotencyKey: string;
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
      queryFn: () => {
        return {
          data: {
            razorpayOrderId: null, // intentionally null — no server order_id needed
            amount: 393,           // ₹393 test amount
            currency: 'INR',
            keyId: RAZORPAY_TEST_KEY,
          },
        };
      },
    }),

    verifyPayment: builder.mutation<
      boolean,
      { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
    >({
      queryFn: () => {
        // Mock: always return true — order status is updated locally by PaymentScreen
        return { data: true };
      },
    }),
  }),
});

export const { useInitiatePaymentMutation, useVerifyPaymentMutation } = paymentsApi;
