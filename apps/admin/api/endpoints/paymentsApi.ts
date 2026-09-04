import { baseApi } from '../baseApi';
import type {
  CommissionConfig,
  PaymentSettlementRecord,
  PaymentSplitBreakdown,
  RefundInitiation,
  RefundPaymentBody,
} from '../../features/payments/types';

/**
 * Payments RTK — Commission Settlement, Payment Distribution & Refunds.
 */
export const paymentsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getSettlements: builder.query<PaymentSettlementRecord[], void>({
      query: () => '/api/v1/admin/payments/settlements',
      providesTags: [{ type: 'Payment', id: 'LIST' }],
    }),
    getCommissionRules: builder.query<CommissionConfig, void>({
      query: () => '/api/v1/admin/payments/commission-rules',
    }),
    updateCommissionRules: builder.mutation<CommissionConfig, CommissionConfig>({
      query: (config) => ({
        url: '/api/v1/admin/payments/commission-rules',
        method: 'POST',
        body: config,
      }),
    }),
    calculateSplit: builder.mutation<
      PaymentSplitBreakdown,
      { foodSubtotal: number; deliveryFee: number }
    >({
      query: ({ foodSubtotal, deliveryFee }) => ({
        url: `/api/v1/admin/payments/calculate-split?foodSubtotal=${foodSubtotal}&deliveryFee=${deliveryFee}`,
        method: 'POST',
      }),
    }),
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

export const {
  useGetSettlementsQuery,
  useGetCommissionRulesQuery,
  useUpdateCommissionRulesMutation,
  useCalculateSplitMutation,
  useRefundPaymentMutation,
} = paymentsApi;
