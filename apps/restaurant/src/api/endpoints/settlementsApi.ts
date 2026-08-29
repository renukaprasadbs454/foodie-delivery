import { baseApi } from '../baseApi';

export interface RestaurantSettlement {
    id: string;
    restaurantId: string;
    settlementNumber: string;
    settlementPeriodStart: string;
    settlementPeriodEnd: string;
    grossSales: number;
    commissionAmount: number;
    taxDeducted: number;
    netPayable: number;
    status: 'PENDING' | 'APPROVED' | 'DISBURSED' | 'FAILED';
    paymentReference?: string;
    disbursedAt?: string;
    createdAt: string;
}

export interface RestaurantEarningsSummary {
    grossEarnings: number;
    netSettled: number;
    pendingPayout: number;
    totalOrders: number;
    totalSettlements: number;
}

export const settlementsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getRestaurantSettlements: builder.query<RestaurantSettlement[], void>({
            query: () => '/api/v1/restaurants/me/settlements',
            providesTags: [{ type: 'Restaurant', id: 'SETTLEMENTS' }],
            keepUnusedDataFor: 60,
        }),
        getRestaurantEarnings: builder.query<RestaurantEarningsSummary, void>({
            query: () => '/api/v1/restaurants/me/earnings',
            providesTags: [{ type: 'Restaurant', id: 'EARNINGS' }],
            keepUnusedDataFor: 60,
        }),
    }),
});

export const {
    useGetRestaurantSettlementsQuery,
    useGetRestaurantEarningsQuery,
} = settlementsApi;
