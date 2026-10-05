import { baseApi } from '../baseApi';

export interface IncentiveOfferProgress {
  id: string;
  title: string;
  category: string;
  description: string;
  target: number;
  currentProgress: number;
  rewardAmount: number;
  unit: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Earned' | 'Expired';
  remaining: number | null;
  validityPeriod: string;
  isEarned: boolean;
  active: boolean;
}

export interface IncentivesProgressResponse {
  date: string;
  tripsCompleted: number;
  incentivesEarned: number;
  offers: IncentiveOfferProgress[];
}

export interface IncentiveEarningHistory {
  id: string;
  ruleId: string;
  ruleTitle: string;
  amount: number;
  referenceType: string;
  referenceId: string;
  orderId?: string;
  periodDate: string;
  earnedAt: string;
}

export const incentivesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getIncentivesProgress: builder.query<IncentivesProgressResponse, { date?: string } | void>({
      query: (params) => ({
        url: '/api/v1/delivery/incentives/progress',
        params: params?.date ? { date: params.date } : undefined,
      }),
      providesTags: ['Delivery', 'Wallet'],
      keepUnusedDataFor: 30,
    }),
    getActiveIncentives: builder.query<IncentiveOfferProgress[], void>({
      query: () => '/api/v1/delivery/incentives',
      providesTags: ['Delivery'],
      keepUnusedDataFor: 60,
    }),
    getIncentiveEarnings: builder.query<IncentiveEarningHistory[], void>({
      query: () => '/api/v1/delivery/incentives/earnings',
      providesTags: ['Wallet', 'Delivery'],
      keepUnusedDataFor: 60,
    }),
  }),
});

export const {
  useGetIncentivesProgressQuery,
  useGetActiveIncentivesQuery,
  useGetIncentiveEarningsQuery,
} = incentivesApi;
