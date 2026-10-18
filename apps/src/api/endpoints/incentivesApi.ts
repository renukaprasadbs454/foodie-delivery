import { baseApi } from '../baseApi';

export interface IncentiveMilestone {
  trips: number;
  rewardAmount: number;
  status: 'Completed' | 'In Progress' | 'Upcoming' | 'Locked';
  remaining: number;
  isEarned: boolean;
}

export interface IncentiveConditionProgress {
  id: string;
  type: string;
  title: string;
  value: string;
  subtext: string;
  status: 'SATISFIED' | 'PENDING' | 'FAILED';
  progressPercentage: number;
  currentProgressText?: string;
}

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
  milestones?: IncentiveMilestone[];
  conditions?: IncentiveConditionProgress[];
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

export interface DeliveryIncentivesEarningsSummary {
  regularDeliveryEarnings: number;
  incentiveEarnings: number;
  earnedIncentives: number;
  pendingIncentives: number;
  paidOutIncentives: number;
  availableBalance: number;
  recentIncentiveTransactions: IncentiveEarningHistory[];
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
    getEarningsSummary: builder.query<DeliveryIncentivesEarningsSummary, void>({
      query: () => '/api/v1/delivery/incentives/earnings-summary',
      providesTags: ['Wallet', 'Delivery'],
      keepUnusedDataFor: 30,
    }),
  }),
});

export const {
  useGetIncentivesProgressQuery,
  useGetActiveIncentivesQuery,
  useGetIncentiveEarningsQuery,
  useGetEarningsSummaryQuery,
} = incentivesApi;
