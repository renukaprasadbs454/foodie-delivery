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
    setItems([]);
  }, [filterKey]);

  const query = useGetNotificationsQuery({
    unreadOnly,
    page,
    size,
  });

  useEffect(() => {
    if (!query.isSuccess || !query.data) return;
    setItems((prev) => {
      if (page === 0) return query.data ?? [];
      const seen = new Set(prev.map((n) => n.notificationLogId));
      const next = [...prev];
      for (const row of query.data) {
        if (!seen.has(row.notificationLogId)) next.push(row);
      }
      return next;
    });
  }, [page, query.data, query.isSuccess]);

  const onLoadMore = useCallback(() => {
    if (query.isFetching || query.isLoading) return;
    if (!hasMoreNotificationPages(query.data, size)) return;
    setPage((p) => p + 1);
  }, [query.data, query.isFetching, query.isLoading, size]);

  const onRefresh = useCallback(async () => {
    setPage(0);
    setItems([]);
    await query.refetch();
  }, [query]);

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
    isLoading: query.isLoading && page === 0 && items.length === 0,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: onRefresh,
    onLoadMore,
    hasMore: hasMoreNotificationPages(query.data, size),
    patchLocalRead,
    rollbackLocal,
  };
}
