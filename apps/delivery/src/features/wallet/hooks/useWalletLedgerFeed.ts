import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGetWalletLedgerQuery } from '../../../api/endpoints/walletApi';
import type { LedgerEntry, LedgerSort } from '../types';
import {
  DEFAULT_LEDGER_PAGE_SIZE,
  hasMoreLedgerPages,
} from '../types';

type FeedArgs = {
  sort?: LedgerSort;
  createdAtFrom?: string;
  createdAtTo?: string;
  size?: number;
};

/** Page-accumulated ledger feed — UI-API infinite ledger. */
export function useWalletLedgerFeed(args: FeedArgs = {}) {
  const size = args.size ?? DEFAULT_LEDGER_PAGE_SIZE;
  const filterKey = useMemo(
    () =>
      JSON.stringify({
        sort: args.sort ?? 'createdAt',
        createdAtFrom: args.createdAtFrom ?? '',
        createdAtTo: args.createdAtTo ?? '',
        size,
      }),
    [args.createdAtFrom, args.createdAtTo, args.sort, size],
  );

  const [page, setPage] = useState(0);
  const [items, setItems] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    setPage(0);
    setItems([]);
  }, [filterKey]);

  const query = useGetWalletLedgerQuery({
    page,
    size,
    sort: args.sort ?? 'createdAt',
    createdAtFrom: args.createdAtFrom,
    createdAtTo: args.createdAtTo,
  });

  useEffect(() => {
    if (!query.isSuccess || !query.data) return;
    setItems((prev) => {
      if (page === 0) return query.data ?? [];
      const seen = new Set(prev.map((r) => r.ledgerEntryId));
      const next = [...prev];
      for (const row of query.data) {
        if (!seen.has(row.ledgerEntryId)) next.push(row);
      }
      return next;
    });
  }, [page, query.data, query.isSuccess]);

  const onLoadMore = useCallback(() => {
    if (query.isFetching || query.isLoading) return;
    if (!hasMoreLedgerPages(query.data, size)) return;
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
    refetch: onRefresh,
    onLoadMore,
    hasMore: hasMoreLedgerPages(query.data, size),
  };
}
