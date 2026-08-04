'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Button,
  EmptyState,
  Text,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-web';
import {
  useGetDailySalesQuery,
  useGetDashboardSummaryQuery,
  useGetOrderStatusMetricsQuery,
} from '@/api/endpoints/analyticsApi';
import { selectAdminRole } from '@/features/auth/authSlice';
import { useAppSelector } from '@/store/hooks';
import {
  canAccessAnalyticsSummary,
  canAccessOrderStatusMetrics,
} from '@/lib/routeGuards';
import { AnalyticsSkeleton } from '../components/AnalyticsSkeleton';
import { DateRangePicker } from '../components/DateRangePicker';
import { KpiGrid } from '../components/KpiGrid';
import { OrderStatusTable } from '../components/OrderStatusTable';
import { PermissionDenied } from '../components/PermissionDenied';
import {
  defaultDateRange,
  validateDateRange,
  type AnalyticsDateRange,
} from '../types';

/** Code-split chart bundle — SD §25 / UI-API Analytics acceptance. */
const DailySalesChart = dynamic(
  () => import('../components/DailySalesChart'),
  {
    ssr: false,
    loading: () => <AnalyticsSkeleton />,
  },
);

function toUnwrappedApiError(err: unknown): {
  code: string;
  message: string;
  fields: null;
} {
  if (err && typeof err === 'object') {
    const withData = err as { data?: { code?: string; message?: string } };
    if (withData.data?.code) {
      return {
        code: withData.data.code,
        message: withData.data.message ?? 'Something went wrong',
        fields: null,
      };
    }
  }
  return { code: 'INTERNAL_ERROR', message: 'Something went wrong', fields: null };
}

/**
 * P2-ADM-02 AdminAnalytics — summary + daily-sales + order-status metrics.
 * Order-status restricted to OPS / SUPER_ADMIN.
 */
export function AnalyticsPage() {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const role = useAppSelector(selectAdminRole);
  const canSummary = canAccessAnalyticsSummary(role);
  const canStatus = canAccessOrderStatusMetrics(role);

  const [draft, setDraft] = useState<AnalyticsDateRange>(() => defaultDateRange());
  const [applied, setApplied] = useState<AnalyticsDateRange>(() => defaultDateRange());
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const summaryQuery = useGetDashboardSummaryQuery(applied, {
    skip: !canSummary || Boolean(rangeError),
  });
  const salesQuery = useGetDailySalesQuery(applied, {
    skip: !canSummary || Boolean(rangeError),
  });
  const statusQuery = useGetOrderStatusMetricsQuery(applied, {
    skip: !canStatus || Boolean(rangeError),
  });

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onInlineField: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onFullScreen: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) => setToast({ message: error.message, variant: 'error' }),
  });

  useEffect(() => {
    trackAnalyticsEvent('admin_analytics_viewed');
    trackAnalyticsEvent('analytics_viewed');
  }, []);

  useEffect(() => {
    const err = summaryQuery.error ?? salesQuery.error ?? statusQuery.error;
    if (!err) return;
    if (summaryQuery.isError || salesQuery.isError || statusQuery.isError) {
      handleError(toUnwrappedApiError(err));
    }
  }, [
    summaryQuery.isError,
    summaryQuery.error,
    salesQuery.isError,
    salesQuery.error,
    statusQuery.isError,
    statusQuery.error,
    handleError,
  ]);

  const summaryForbidden = useMemo(() => {
    if (!summaryQuery.isError || !summaryQuery.error) return false;
    return toUnwrappedApiError(summaryQuery.error).code === 'FORBIDDEN';
  }, [summaryQuery.isError, summaryQuery.error]);

  const applyRange = () => {
    const validated = validateDateRange(draft.dateFrom, draft.dateTo);
    if (!validated.ok) {
      setRangeError(validated.message);
      setToast({ message: validated.message, variant: 'error' });
      return;
    }
    setRangeError(null);
    setApplied(validated.range);
    trackAnalyticsEvent('date_range_changed', {
      dateFrom: validated.range.dateFrom,
      dateTo: validated.range.dateTo,
      screen: 'analytics',
    });
  };

  if (!canSummary) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
        <Text as="h1" variant="heading1">
          Analytics
        </Text>
        <PermissionDenied
          description={
            role === 'SUPPORT'
              ? 'SUPPORT cannot view analytics.'
              : 'Admin role claim is unavailable (GAP-API-13 residual). Analytics stay fail-closed.'
          }
        />
      </div>
    );
  }

  const loading =
    (summaryQuery.isLoading && !summaryQuery.data) ||
    (salesQuery.isLoading && !salesQuery.data);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
      <Text as="h1" variant="heading1">
        Analytics
      </Text>

      {!isConnected ? (
        <Text as="p" variant="caption" color={tokens.color.warning}>
          Offline — showing cached analytics when available.
        </Text>
      ) : null}

      <DateRangePicker value={draft} onChange={setDraft} />
      <div>
        <Button
          label="Apply range"
          aria-label="Apply date range"
          onClick={applyRange}
        />
      </div>
      {rangeError ? (
        <Text as="p" variant="caption" color={tokens.color.error}>
          {rangeError}
        </Text>
      ) : null}

      {summaryForbidden ? (
        <PermissionDenied description="Server denied analytics for your role (FORBIDDEN)." />
      ) : loading ? (
        <AnalyticsSkeleton />
      ) : (
        <>
          {summaryQuery.data ? <KpiGrid summary={summaryQuery.data} /> : null}
          {salesQuery.data ? (
            <DailySalesChart points={salesQuery.data} />
          ) : salesQuery.isError ? (
            <EmptyState
              title="Could not load daily sales"
              description="Retry after checking connectivity."
              aria-label="Daily sales error"
              actionLabel="Retry"
              onAction={() => {
                void salesQuery.refetch();
              }}
            />
          ) : null}

          <div style={{ marginTop: tokens.spacing.md }}>
            {canStatus ? (
              statusQuery.isLoading && !statusQuery.data ? (
                <AnalyticsSkeleton />
              ) : statusQuery.data ? (
                <OrderStatusTable metrics={statusQuery.data} />
              ) : statusQuery.isError ? (
                <PermissionDenied description="Order status metrics denied or failed (OPS / SUPER_ADMIN)." />
              ) : null
            ) : (
              <PermissionDenied description="Order status metrics require OPS or SUPER_ADMIN." />
            )}
          </div>
        </>
      )}

      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        aria-label={toast?.message ?? 'Toast'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
