import { isNotificationUnread } from '../features/notifications/types';

describe('notifications helpers (P2-RES-05)', () => {
  it('treats missing readAt as unread', () => {
    expect(
      isNotificationUnread({ notificationLogId: '1', readAt: null }),
    ).toBe(true);
    expect(
      isNotificationUnread({ notificationLogId: '2', readAt: '' }),
    ).toBe(true);
  });

  it('treats populated readAt as read', () => {
    expect(
      isNotificationUnread({
        notificationLogId: '3',
        readAt: '2026-08-03T00:00:00Z',
      }),
    ).toBe(false);
  });
});
