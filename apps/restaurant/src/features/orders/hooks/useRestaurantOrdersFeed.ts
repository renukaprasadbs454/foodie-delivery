import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGetRestaurantOrdersQuery } from '../../../api/endpoints/ordersApi';
import type {
  OrderSort,
  OrderSummary,
  RestaurantOrdersParams,
} from '../types';
import { DEFAULT_ORDERS_PAGE_SIZE, hasMoreOrderPages } from '../types';

type FeedArgs = Omit<RestaurantOrdersParams, 'page' | 'size'> & {
  size?: number;
  /** Soft poll fallback when WS unavailable (ms). 0 = off. */
  pollingInterval?: number;
};

/** Page-accumulated restaurant orders feed — filter remounts page 0. */
export function useRestaurantOrdersFeed(args: FeedArgs) {
  const size = args.size ?? DEFAULT_ORDERS_PAGE_SIZE;
  const filterKey = useMemo(
    () =>
      JSON.stringify({
        status: args.status ?? '',
        sort: args.sort ?? 'placedAt',
        size,
      }),
    [args.status, args.sort, size],
  );

  const [page, setPage] = useState(0);
  const [items, setItems] = useState<OrderSummary[]>([]);

  useEffect(() => {
    setPage(0);
    setItems([]);
  }, [filterKey]);

  const query = useGetRestaurantOrdersQuery({
    status: args.status,
    sort: (args.sort ?? 'placedAt') as OrderSort,
    page,
    size,
  }, {
    pollingInterval: args.pollingInterval ?? 0,
    refetchOnFocus: true,
  });

  useEffect(() => {
    if (!query.isSuccess || !query.data) return;
    setItems((prev) => {
      if (page === 0) return query.data ?? [];
      const seen = new Set(prev.map((r) => r.orderId));
      const next = [...prev];
      for (const row of query.data) {
        if (!seen.has(row.orderId)) next.push(row);
      }
      return next;
    });
  }, [page, query.data, query.isSuccess]);

  const onLoadMore = useCallback(() => {
    if (query.isFetching || query.isLoading) return;
    if (!hasMoreOrderPages(query.data, size)) return;
    setPage((p) => p + 1);
  }, [query.data, query.isFetching, query.isLoading, size]);

  const onRefresh = useCallback(async () => {
    setPage(0);
    setItems([]);
    await query.refetch();
  }, [query]);

  return {
    items,
    isLoading: query.isLoading && page === 0 && items.length === 0,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: onRefresh,
    onLoadMore,
    hasMore: hasMoreOrderPages(query.data, size),
  };
}
