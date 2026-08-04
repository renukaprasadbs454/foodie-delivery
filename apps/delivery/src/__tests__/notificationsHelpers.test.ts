import {
  hasMoreNotificationPages,
  isNotificationUnread,
} from '../features/notifications/types';

describe('P2-DEL-05 notification helpers', () => {
  it('detects unread when readAt missing', () => {
    expect(
      isNotificationUnread({
        notificationLogId: '1',
        title: 'Hi',
        body: 'Body',
        readAt: null,
      }),
    ).toBe(true);
    expect(
      isNotificationUnread({
        notificationLogId: '1',
        title: 'Hi',
        body: 'Body',
        readAt: '2026-08-03T00:00:00Z',
      }),
    ).toBe(false);
  });

  it('detects more pages by page length', () => {
    expect(hasMoreNotificationPages(new Array(20).fill({}), 20)).toBe(true);
    expect(hasMoreNotificationPages(new Array(2).fill({}), 20)).toBe(false);
  });
});
