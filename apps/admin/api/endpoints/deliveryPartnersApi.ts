import { baseApi } from '../baseApi';
import type { DeliveryPartnerProfile } from '../../features/deliveryPartners/types';

export interface DeliveryPricingConfig {
  minPricePerDelivery: number;
  moneyPerKm: number;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UpdateDeliveryPricingRequest {
  minPricePerDelivery: number;
  moneyPerKm: number;
}

export const deliveryPartnersApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    approveDeliveryPartnerKyc: builder.mutation<DeliveryPartnerProfile, string>({
      query: (partnerId) => ({
        url: `/api/bff/admin/delivery-partners/${partnerId}/kyc-approve`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Delivery', id },
        { type: 'Admin', id: 'DELIVERY' },
      ],
    }),
    getDeliveryPricing: builder.query<DeliveryPricingConfig, void>({
      query: () => '/api/bff/admin/delivery-pricing',
      providesTags: [{ type: 'Admin', id: 'DELIVERY_PRICING' }],
    }),
    updateDeliveryPricing: builder.mutation<DeliveryPricingConfig, UpdateDeliveryPricingRequest>({
      query: (body) => ({
        url: '/api/bff/admin/delivery-pricing',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'Admin', id: 'DELIVERY_PRICING' }],
    }),
  }),
});

export const {
  useApproveDeliveryPartnerKycMutation,
  useGetDeliveryPricingQuery,
  useUpdateDeliveryPricingMutation,
} = deliveryPartnersApi;
