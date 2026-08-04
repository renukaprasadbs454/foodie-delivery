import { baseApi } from '../baseApi';
import type {
  InboxNotification,
  NotificationsParams,
} from '../../features/notifications/types';
import { DEFAULT_NOTIFICATIONS_PAGE_SIZE } from '../../features/notifications/types';

function normalizeNotificationList(data: unknown): InboxNotification[] {
  if (Array.isArray(data)) return data as InboxNotification[];
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { content?: unknown }).content)
  ) {
    return (data as { content: InboxNotification[] }).content;
  }
  return [];
}

/**
 * Notifications RTK — P2-RES-05 Settings optional badge only.
 * GET contracted on Restaurant Settings; no PATCH mark-read / no invent inbox
 * (GAP-IA-02). Device-token Gap — not called.
 */
export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<InboxNotification[], NotificationsParams>({
      query: ({
        unreadOnly = false,
        page = 0,
        size = DEFAULT_NOTIFICATIONS_PAGE_SIZE,
      }) => ({
        url: '/api/v1/notifications',
        params: {
          unreadOnly,
          page,
          size: Math.min(size, 100),
        },
      }),
      transformResponse: (response: unknown) =>
        normalizeNotificationList(response),
      providesTags: [{ type: 'Notification', id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),
  }),
});

export const { useGetNotificationsQuery } = notificationsApi;
