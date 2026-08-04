import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGetRestaurantsQuery } from '../../../api/endpoints/restaurantsApi';
import type { RestaurantListParams, RestaurantSummary } from '../types';
import {
  DEFAULT_RESTAURANT_PAGE_SIZE,
  hasMoreRestaurantPages,
} from '../types';

type FeedArgs = Omit<RestaurantListParams, 'page' | 'size'> & {
  size?: number;
};

/**
 * Page-accumulated restaurant feed — filter/sort changes must remount or call
 * reset via changing `args` identity (page resets when filter key changes).
 */
export function useRestaurantFeed(args: FeedArgs) {
  const size = args.size ?? DEFAULT_RESTAURANT_PAGE_SIZE;
  const filterKey = useMemo(
    () =>
      JSON.stringify({
        search: args.search ?? '',
        cuisineType: args.cuisineType ?? '',
        sort: args.sort ?? '',
        lat: args.lat ?? null,
        lng: args.lng ?? null,
        size,
      }),
    [args.search, args.cuisineType, args.sort, args.lat, args.lng, size],
  );

  const [page, setPage] = useState(0);
  const [items, setItems] = useState<RestaurantSummary[]>([]);

  useEffect(() => {
    setPage(0);
    setItems([]);
  }, [filterKey]);

  const query = useGetRestaurantsQuery({
    search: args.search,
    lat: args.lat,
    lng: args.lng,
    cuisineType: args.cuisineType,
    sort: args.sort,
    page,
    size,
  });

  useEffect(() => {
    if (!query.isSuccess || !query.data) return;
    setItems((prev) => {
      if (page === 0) return query.data ?? [];
      const seen = new Set(prev.map((r) => r.id));
      const next = [...prev];
      for (const row of query.data) {
        if (!seen.has(row.id)) next.push(row);
      }
      return next;
    });
  }, [page, query.data, query.isSuccess]);

  const onLoadMore = useCallback(() => {
    if (query.isFetching || query.isLoading) return;
    if (!hasMoreRestaurantPages(query.data, size)) return;
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
    hasMore: hasMoreRestaurantPages(query.data, size),
  };
}
