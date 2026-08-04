/**
 * P2-RES-05 notification types — GET /notifications for Settings badge only.
 * No dedicated inbox UI (GAP-IA-02). No mark-read / send APIs on this surface.
 */

export type InboxNotification = {
  notificationLogId: string;
  title?: string;
  body?: string;
  readAt?: string | null;
  createdAt?: string;
};

export type NotificationsParams = {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
};

export const DEFAULT_NOTIFICATIONS_PAGE_SIZE = 20;

/** Unread = missing readAt (same heuristic as customer CUS-09). */
export function isNotificationUnread(row: InboxNotification): boolean {
  return row.readAt == null || row.readAt === '';
}
