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

  const handledErrorRef = React.useRef<unknown>(null);

  useEffect(() => {
    trackAnalyticsEvent('admin_analytics_viewed');
    trackAnalyticsEvent('analytics_viewed');
  }, []);

  useEffect(() => {
    const err = summaryQuery.error ?? salesQuery.error ?? statusQuery.error;
    if (!err) return;
    if (handledErrorRef.current !== err) {
      handledErrorRef.current = err;
      const unwrapped = toUnwrappedApiError(err);
      if (unwrapped.code !== 'FORBIDDEN' && unwrapped.code !== 'UNAUTHORIZED') {
        setToast({ message: unwrapped.message, variant: 'error' });
      }
    }
  }, [
    summaryQuery.isError,
    summaryQuery.error,
    salesQuery.isError,
    salesQuery.error,
    statusQuery.isError,
    statusQuery.error,
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
    setToast({
      message: ` Custom date range applied: ${validated.range.dateFrom} to ${validated.range.dateTo}`,
      variant: 'success',
    });
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
              : 'Admin role claim is unavailable. Analytics stay fail-closed.'
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
        Executive Marketplace Analytics
      </Text>

      {!isConnected ? (
        <Text as="p" variant="caption" color={tokens.color.warning}>
          Offline — showing cached analytics when available.
        </Text>
      ) : null}

      {/* Timeframe Filter Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: 14,
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#14532D', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span> Analytics Timeframe Filter</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#047857',
                backgroundColor: '#D1FAE5',
                padding: '2px 8px',
                borderRadius: 12,
              }}
            >
              {applied.dateFrom} to {applied.dateTo}
            </span>
          </div>

          {/* Preset shortcuts */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Today', days: 0 },
              { label: 'Yesterday', days: 1, offset: 1 },
              { label: 'Last 7 Days', days: 6 },
              { label: 'Last 30 Days', days: 29 },
              { label: 'This Month', days: 30 },
            ].map((preset) => {
              const now = new Date();
              const to = new Date();
              const from = new Date();
              if (preset.offset) {
                to.setDate(now.getDate() - preset.offset);
                from.setDate(now.getDate() - preset.offset);
              } else {
                from.setDate(now.getDate() - preset.days);
              }
              const fromStr = from.toISOString().split('T')[0];
              const toStr = to.toISOString().split('T')[0];
              const isPresetActive = applied.dateFrom === fromStr && applied.dateTo === toStr;

              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setRangeError(null);
                    setDraft({ dateFrom: fromStr, dateTo: toStr });
                    setApplied({ dateFrom: fromStr, dateTo: toStr });
                    trackAnalyticsEvent('date_range_changed', {
                      dateFrom: fromStr,
                      dateTo: toStr,
                      screen: 'analytics',
                      preset: preset.label,
                    });
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: isPresetActive ? '1px solid #14532D' : '1px solid #CBD5E1',
                    backgroundColor: isPresetActive ? '#14532D' : '#F8FAFC',
                    color: isPresetActive ? '#FEF3C7' : '#475569',
                    fontSize: 12,
                    fontWeight: isPresetActive ? 800 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <DateRangePicker value={draft} onChange={setDraft} />
          <button
            type="button"
            aria-label="Apply date range"
            onClick={applyRange}
            style={{
              padding: '8px 18px',
              backgroundColor: '#F59E0B',
              color: '#0F3D21',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            Apply Custom Range
          </button>
        </div>
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
          <KpiGrid
            summary={
              summaryQuery.data ?? {
                totalOrders: 0,
                totalRevenue: 0,
                activeRestaurants: 0,
                activeDeliveryPartners: 0,
                newCustomers: 0,
                avgOrderValue: 0,
              }
            }
          />

          <DailySalesChart
            points={salesQuery.data ?? []}
          />

          <div style={{ marginTop: tokens.spacing.md }}>
            <OrderStatusTable
              metrics={statusQuery.data ?? []}
            />
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
