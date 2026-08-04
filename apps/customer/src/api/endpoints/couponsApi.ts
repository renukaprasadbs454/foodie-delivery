import { baseApi } from '../baseApi';
import type {
  ApplyCouponRequest,
  ApplyCouponResult,
  EligibleCoupon,
} from '../../features/checkout/types';

export type EligibleCouponsArg = {
  restaurantId: string;
  cartTotal: number | string;
};

/**
 * P2-CUS-04 coupons on Checkout — eligible list + apply preview (no redeem).
 */
export const couponsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEligibleCoupons: builder.query<EligibleCoupon[], EligibleCouponsArg>({
      query: ({ restaurantId, cartTotal }) => ({
        url: '/api/v1/coupons/eligible',
        params: { restaurantId, cartTotal },
      }),
      transformResponse: (response: unknown) => {
        if (Array.isArray(response)) return response as EligibleCoupon[];
        return [];
      },
      providesTags: [{ type: 'Coupon', id: 'ELIGIBLE' }],
      keepUnusedDataFor: 0,
    }),
    applyCoupon: builder.mutation<ApplyCouponResult, ApplyCouponRequest>({
      query: (body) => ({
        url: '/api/v1/coupons/apply',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Coupon', id: 'ELIGIBLE' }],
    }),
  }),
});

export const { useGetEligibleCouponsQuery, useApplyCouponMutation } =
  couponsApi;
