import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGetNotificationsQuery } from '../../../api/endpoints/notificationsApi';
import type { InboxNotification } from '../types';
import {
  DEFAULT_NOTIFICATIONS_PAGE_SIZE,
  hasMoreNotificationPages,
} from '../types';

/** Page-accumulated notifications feed with unreadOnly filter. */
export function useNotificationsFeed(unreadOnly: boolean) {
  const size = DEFAULT_NOTIFICATIONS_PAGE_SIZE;
  const filterKey = useMemo(
    () => JSON.stringify({ unreadOnly, size }),
    [unreadOnly, size],
  );

  const [page, setPage] = useState(0);
  const [items, setItems] = useState<InboxNotification[]>([]);
  useEffect(() => {
    setPage(0);
    setItems([
      {
        notificationLogId: 'n1',
        title: 'Order Placed Successfully! 🎉',
        body: 'Your order #ORD-883921 has been placed and confirmed by the restaurant. The chef is starting preparations.',
        category: 'ORDER_PLACED',
        readAt: null,
        data: '{"orderId":"ORD-883921"}',
        createdAt: new Date().toISOString()
      },
      {
        notificationLogId: 'n2',
        title: 'Delivery Partner Assigned 🛵',
        body: 'Suresh Kumar is assigned to your order. He is on his way to the restaurant.',
        category: 'RIDER_ASSIGNED',
        readAt: null,
        data: '{"orderId":"ORD-883921"}',
        createdAt: new Date(Date.now() - 60000 * 5).toISOString()
      },
      {
        notificationLogId: 'n3',
        title: 'Rider Reached Restaurant 📍',
        body: 'Suresh Kumar has reached the restaurant and is waiting to pick up your order.',
        category: 'RIDER_ARRIVED',
        readAt: null,
        data: '{"orderId":"ORD-883921"}',
        createdAt: new Date(Date.now() - 60000 * 12).toISOString()
      },
      {
        notificationLogId: 'n4',
        title: 'Order Delivered! 🍽️',
        body: 'Enjoy your meal! Please rate your experience out of 5 stars.',
        category: 'ORDER_DELIVERED',
        readAt: null,
        data: '{"orderId":"ORD-883921"}',
        createdAt: new Date(Date.now() - 60000 * 30).toISOString()
      }
    ].filter(n => !unreadOnly || !n.readAt));
  }, [filterKey]);

  const query = useGetNotificationsQuery({
    unreadOnly,
    page,
    size,
  });

  useEffect(() => {
    // API syncing disabled for pure mock mode.
  }, [page, query.data, query.isSuccess]);

  const onLoadMore = useCallback(() => { }, []);

  const onRefresh = useCallback(async () => {
    setPage(0);
    // Refresh logic disabled for mock simulation
  }, []);

  const patchLocalRead = useCallback((notificationLogId: string, readAt: string) => {
    setItems((prev) => {
      if (unreadOnly) {
        return prev.filter((n) => n.notificationLogId !== notificationLogId);
      }
      return prev.map((n) =>
        n.notificationLogId === notificationLogId ? { ...n, readAt } : n,
      );
    });
  }, [unreadOnly]);

  const rollbackLocal = useCallback((snapshot: InboxNotification[]) => {
    setItems(snapshot);
  }, []);

  return {
    items,
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    refetch: onRefresh,
    onLoadMore,
    hasMore: false,
    patchLocalRead,
    rollbackLocal,
  };
}
