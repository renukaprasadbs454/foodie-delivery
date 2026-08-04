'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { useGetDashboardSummaryQuery } from '@/api/endpoints/analyticsApi';
import { selectAdminRole } from '@/features/auth/authSlice';
import { useAppSelector } from '@/store/hooks';
import { canAccessAnalyticsSummary } from '@/lib/routeGuards';
import { DashboardKpiSkeleton } from '../components/DashboardKpiSkeleton';
import { DateRangePicker } from '../components/DateRangePicker';
import { KpiGrid } from '../components/KpiGrid';
import { PermissionDenied } from '../components/PermissionDenied';
import {
  defaultDateRange,
  validateDateRange,
  type AnalyticsDateRange,
} from '../types';

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
 * P2-ADM-02 AdminDashboard — GET dashboard-summary.
 * SUPPORT / missing role → Permission Denied (not empty KPIs).
 */
export function DashboardPage() {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const role = useAppSelector(selectAdminRole);
  const allowed = canAccessAnalyticsSummary(role);

  const [draft, setDraft] = useState<AnalyticsDateRange>(() => defaultDateRange());
  const [applied, setApplied] = useState<AnalyticsDateRange>(() => defaultDateRange());
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const skip = !allowed || Boolean(rangeError);
  const query = useGetDashboardSummaryQuery(applied, {
    skip,
    refetchOnFocus: true,
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
    trackAnalyticsEvent('admin_dashboard_viewed');
  }, []);

  useEffect(() => {
    if (query.isSuccess && query.data) {
      trackAnalyticsEvent('analytics_dashboard_loaded', {
        dateFrom: applied.dateFrom,
        dateTo: applied.dateTo,
      });
    }
  }, [query.isSuccess, query.data, applied.dateFrom, applied.dateTo]);

  useEffect(() => {
    if (!query.isError || !query.error) return;
    handleError(toUnwrappedApiError(query.error));
  }, [query.isError, query.error, handleError]);

  const forbidden = useMemo(() => {
    if (!query.isError || !query.error) return false;
    return toUnwrappedApiError(query.error).code === 'FORBIDDEN';
  }, [query.isError, query.error]);

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
      screen: 'dashboard',
    });
  };

  if (!allowed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
        <Text as="h1" variant="heading1">
          Dashboard
        </Text>
        <PermissionDenied
          description={
            role === 'SUPPORT'
              ? 'SUPPORT cannot view analytics KPIs.'
              : 'Admin role claim is unavailable (GAP-API-13 residual). Analytics stay fail-closed — not empty KPIs.'
          }
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
      <Text as="h1" variant="heading1">
        Dashboard
      </Text>

      {!isConnected ? (
        <Text as="p" variant="caption" color={tokens.color.warning}>
          Offline — showing cached summary when available.
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

      {forbidden ? (
        <PermissionDenied description="Server denied analytics for your role (FORBIDDEN)." />
      ) : query.isLoading && !query.data ? (
        <DashboardKpiSkeleton />
      ) : query.data ? (
        <KpiGrid summary={query.data} />
      ) : query.isError ? (
        <EmptyState
          title="Could not load dashboard"
          description="Retry after checking the date range."
          aria-label="Dashboard error"
          actionLabel="Retry"
          onAction={() => {
            void query.refetch();
          }}
        />
      ) : (
        <DashboardKpiSkeleton />
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
