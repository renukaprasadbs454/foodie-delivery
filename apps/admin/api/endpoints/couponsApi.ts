import { baseApi } from '../baseApi';
import type {
  Coupon,
  CreateCouponBody,
  DeactivateCouponResult,
} from '../../features/coupons/types';

/**
 * Coupons RTK — P2-ADM-05 create + deactivate only.
 * No admin coupon list GET (GAP-API-19).
 */
export const couponsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    createCoupon: builder.mutation<Coupon, CreateCouponBody>({
      query: (body) => ({
        url: '/api/bff/admin/coupons',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Coupon', id: 'LIST' },
        { type: 'Admin', id: 'COUPON' },
      ],
    }),
    deactivateCoupon: builder.mutation<DeactivateCouponResult, string>({
      query: (couponId) => ({
        url: `/api/bff/admin/coupons/${couponId}/deactivate`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Coupon', id },
        { type: 'Coupon', id: 'LIST' },
        { type: 'Admin', id: 'COUPON' },
      ],
    }),
  }),
});

export const { useCreateCouponMutation, useDeactivateCouponMutation } =
  couponsApi;
