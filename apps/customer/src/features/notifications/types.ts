/**
 * P2-CUS-09 Notifications — UI-API inbox + NotificationResponseDto /
 * NotificationReadResponseDto.
 */

export type InboxNotification = {
  notificationLogId: string;
  title: string;
  body: string;
  sentAt?: string | null;
  readAt?: string | null;
};

export type NotificationReadResult = {
  notificationLogId: string;
  readAt: string;
};

export type NotificationsParams = {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
};

export const DEFAULT_NOTIFICATIONS_PAGE_SIZE = 20;

export function isNotificationUnread(item: InboxNotification): boolean {
  return item.readAt == null || String(item.readAt).length === 0;
}

export function hasMoreNotificationPages(
  page: InboxNotification[] | undefined,
  size: number,
): boolean {
  if (!page) return false;
  return page.length >= size;
}
