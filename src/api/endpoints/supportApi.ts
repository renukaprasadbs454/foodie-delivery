import { baseApi } from '../baseApi';

export interface SupportConversationDto {
  id: string;
  customerId: string;
  assignedAgentId?: string | null;
  status: 'AI_ACTIVE' | 'WAITING_FOR_AGENT' | 'AGENT_ACTIVE' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  category: string;
  subject: string;
  orderId?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
}

export interface SupportMessageDto {
  id: string;
  conversationId: string;
  senderType: 'CUSTOMER' | 'AGENT' | 'AI' | 'SYSTEM';
  senderId?: string;
  senderName?: string;
  messageType: string;
  content: string;
  createdAt: string;
  readAt?: string | null;
}

export interface CreateTicketPayload {
  category: string;
  subject: string;
  description: string;
  orderId?: string;
  senderName?: string;
}

export interface SendMessagePayload {
  ticketId: string;
  message: string;
  senderName?: string;
}

export const supportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSupportTickets: builder.query<SupportConversationDto[], void>({
      query: () => '/api/v1/support/conversations',
      transformResponse: (response: any) => {
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      },
      providesTags: ['Support'],
    }),

    getTicketMessages: builder.query<SupportMessageDto[], string>({
      query: (id) => `/api/v1/support/conversations/${id}/messages`,
      transformResponse: (response: any) => {
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      },
      providesTags: (_result, _error, id) => [{ type: 'Support', id }],
    }),

    createSupportTicket: builder.mutation<SupportConversationDto, CreateTicketPayload>({
      queryFn: async ({ category, subject, description, orderId, senderName }, _api, _extraOptions, baseQuery) => {
        // 1. Create conversation with category DELIVERY
        const convRes = await baseQuery({
          url: '/api/v1/support/conversations',
          method: 'POST',
          body: {
            category: 'DELIVERY',
            subject: `[${category}] ${subject}`,
            orderId: orderId || null,
          },
        });

        if (convRes.error) {
          return { error: convRes.error };
        }

        const convData = (convRes.data as any)?.data || convRes.data;
        const ticketId = convData?.id;

        if (ticketId && description) {
          // 2. Post initial complaint message
          await baseQuery({
            url: `/api/v1/support/conversations/${ticketId}/messages`,
            method: 'POST',
            body: {
              message: description,
              senderName: senderName || 'Delivery Partner',
              senderType: 'CUSTOMER',
            },
          });

          // 3. Escalate to human support desk
          await baseQuery({
            url: `/api/v1/support/conversations/${ticketId}/escalate`,
            method: 'POST',
          });
        }

        return { data: convData as SupportConversationDto };
      },
      invalidatesTags: ['Support'],
    }),

    sendTicketMessage: builder.mutation<SupportMessageDto, SendMessagePayload>({
      query: ({ ticketId, message, senderName }) => ({
        url: `/api/v1/support/conversations/${ticketId}/messages`,
        method: 'POST',
        body: {
          message,
          senderName: senderName || 'Delivery Partner',
          senderType: 'CUSTOMER',
        },
      }),
      invalidatesTags: (_result, _error, { ticketId }) => [
        { type: 'Support', id: ticketId },
        'Support',
      ],
    }),
  }),
});

export const {
  useGetSupportTicketsQuery,
  useGetTicketMessagesQuery,
  useCreateSupportTicketMutation,
  useSendTicketMessageMutation,
} = supportApi;
