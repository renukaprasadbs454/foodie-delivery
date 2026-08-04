import { baseApi } from '../baseApi';
import type { DeliveryPartnerProfile } from '../../features/deliveryPartners/types';

/**
 * Delivery partner RTK — P2-ADM-03 KYC approve only.
 * No admin partner list GET (GAP-API-15). No invent partner detail GET.
 */
export const deliveryPartnersApi = baseApi.injectEndpoints({
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
  }),
});

export const { useApproveDeliveryPartnerKycMutation } = deliveryPartnersApi;
