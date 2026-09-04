import { baseApi } from '../baseApi';
import type { CustomerProfile, SupportTicket, TicketStatus } from '../../features/customers/types/customerTypes';

export interface CustomerSummary {
  totalRegistered: number;
  pendingApproval: number;
  activeAccounts: number;
  suspendedAccounts: number;
  averageCustomerLtv: number;
}

export interface CustomerDashboardResponse {
  summary: CustomerSummary;
  customers: CustomerProfile[];
  total: number;
  openTicketsCount: number;
}

export interface UpdateCustomerStatusRequest {
  id: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'REJECTED' | 'PENDING_APPROVAL' | 'BLOCKED' | 'APPROVE' | 'REJECT' | 'REACTIVATE';
  reason?: string;
}

export interface UpdateTicketStatusRequest {
  id: string;
  status: TicketStatus;
  agentNotes?: string;
}

export const customersApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    getCustomers: builder.query<CustomerDashboardResponse, { search?: string; status?: string } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.set('search', params.search);
        if (params?.status && params.status !== 'ALL') queryParams.set('status', params.status);
        const searchStr = queryParams.toString();
        return `/api/bff/admin/customers${searchStr ? `?${searchStr}` : ''}`;
      },
      transformResponse: (response: any) => response?.data || response,
      providesTags: [{ type: 'Admin', id: 'CUSTOMERS' }],
      keepUnusedDataFor: 30,
    }),
    updateCustomerStatus: builder.mutation<CustomerProfile, UpdateCustomerStatusRequest>({
      query: ({ id, accountStatus, reason }) => ({
        url: `/api/bff/admin/customers/${id}/status`,
        method: 'PATCH',
        body: { accountStatus, reason },
      }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: [{ type: 'Admin', id: 'CUSTOMERS' }],
    }),
    getSupportTickets: builder.query<SupportTicket[], void>({
      query: () => '/api/bff/admin/support-tickets',
      transformResponse: (response: any) => response?.data || response,
      providesTags: [{ type: 'Admin', id: 'SUPPORT_TICKETS' }],
      keepUnusedDataFor: 30,
    }),
    updateTicketStatus: builder.mutation<SupportTicket, UpdateTicketStatusRequest>({
      query: ({ id, status, agentNotes }) => ({
        url: `/api/bff/admin/support-tickets/${id}/status`,
        method: 'PATCH',
        body: { status, agentNotes },
      }),
      transformResponse: (response: any) => response?.data || response,
      invalidatesTags: [
        { type: 'Admin', id: 'SUPPORT_TICKETS' },
        { type: 'Admin', id: 'CUSTOMERS' },
      ],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useUpdateCustomerStatusMutation,
  useGetSupportTicketsQuery,
  useUpdateTicketStatusMutation,
} = customersApi;
