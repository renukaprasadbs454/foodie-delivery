import { baseApi } from '../baseApi';
import type {
  AnalyticsDateRange,
  DailySalesPoint,
  DashboardSummary,
  OrderStatusMetric,
} from '../../features/analytics/types';

/**
 * Analytics RTK — P2-ADM-02 (UI-API AdminDashboard / AdminAnalytics).
 * BFF proxy paths → `/api/v1/analytics/*`. No invent endpoints. No WS.
 */
export const analyticsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getDashboardSummary: builder.query<DashboardSummary, AnalyticsDateRange>({
      query: ({ dateFrom, dateTo }) => ({
        url: '/api/bff/analytics/dashboard-summary',
        params: { dateFrom, dateTo },
      }),
      providesTags: [{ type: 'Analytics', id: 'SUMMARY' }],
      keepUnusedDataFor: 60,
    }),
    getDailySales: builder.query<DailySalesPoint[], AnalyticsDateRange>({
      query: ({ dateFrom, dateTo }) => ({
        url: '/api/bff/analytics/daily-sales',
        params: { dateFrom, dateTo },
      }),
      providesTags: [{ type: 'Analytics', id: 'DAILY_SALES' }],
      keepUnusedDataFor: 60,
    }),
    getOrderStatusMetrics: builder.query<OrderStatusMetric[], AnalyticsDateRange>({
      query: ({ dateFrom, dateTo }) => ({
        url: '/api/bff/analytics/order-status-metrics',
        params: { dateFrom, dateTo },
      }),
      providesTags: [{ type: 'Analytics', id: 'ORDER_STATUS' }],
      keepUnusedDataFor: 60,
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetDailySalesQuery,
  useGetOrderStatusMetricsQuery,
} = analyticsApi;
