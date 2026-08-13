import { baseApi } from '../baseApi';
import type {
  InboxNotification,
  NotificationReadResult,
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
 * Notifications RTK — P2-DEL-05 (list + mark read + device token).
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
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ notificationLogId }) => ({
              type: 'Notification' as const,
              id: notificationLogId,
            })),
            { type: 'Notification', id: 'LIST' },
          ]
          : [{ type: 'Notification', id: 'LIST' }],
      keepUnusedDataFor: 60,
    }),
    markNotificationRead: builder.mutation<NotificationReadResult, string>({
      query: (notificationLogId) => ({
        url: `/api/v1/notifications/${notificationLogId}/read`,
        method: 'PATCH',
      }),
      async onQueryStarted(notificationLogId, { dispatch, queryFulfilled }) {
        const now = new Date().toISOString();
        const size = DEFAULT_NOTIFICATIONS_PAGE_SIZE;
        const patches = [
          dispatch(
            notificationsApi.util.updateQueryData(
              'getNotifications',
              { unreadOnly: false, page: 0, size },
              (draft) => {
                const row = draft.find(
                  (n) => n.notificationLogId === notificationLogId,
                );
                if (row) row.readAt = now;
              },
            ),
          ),
          dispatch(
            notificationsApi.util.updateQueryData(
              'getNotifications',
              { unreadOnly: true, page: 0, size },
              (draft) => {
                const idx = draft.findIndex(
                  (n) => n.notificationLogId === notificationLogId,
                );
                if (idx >= 0) draft.splice(idx, 1);
              },
            ),
          ),
        ];
        try {
          await queryFulfilled;
        } catch {
          for (const patch of patches) {
            patch.undo();
          }
        }
      },
      invalidatesTags: (_result, _error, id) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
      ],
    }),
    setDeviceToken: builder.mutation<null, { token: string; os: string }>({
      query: (body) => ({
        url: '/api/v1/notification/device-token',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useSetDeviceTokenMutation,
} = notificationsApi;
