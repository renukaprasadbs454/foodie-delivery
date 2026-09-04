'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { SalesAnalyticsChart } from '../components/SalesAnalyticsChart';
import { TopPerformersWidget } from '../components/TopPerformersWidget';
import { RecentOrdersTableWidget } from '../components/RecentOrdersTableWidget';
import {
  defaultDateRange,
  validateDateRange,
  type AnalyticsDateRange,
} from '../types';

import { RoleLandingHub } from '@/components/RoleLandingHub';

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
 * 6amMart Executive Admin Dashboard — Multi-Vendor Operations & Analytics.
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

  const handledErrorRef = React.useRef<unknown>(null);

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
    if (handledErrorRef.current !== query.error) {
      handledErrorRef.current = query.error;
      const unwrapped = toUnwrappedApiError(query.error);
      if (unwrapped.code !== 'FORBIDDEN' && unwrapped.code !== 'UNAUTHORIZED') {
        setToast({ message: unwrapped.message, variant: 'error' });
      }
    }
  }, [query.isError, query.error]);

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
    setToast({
      message: ` Custom date range applied: ${validated.range.dateFrom} to ${validated.range.dateTo}`,
      variant: 'success',
    });
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
              : 'Admin role claim is unavailable. Analytics stay fail-closed — not empty KPIs.'
          }
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Role Activation & Management Hub */}
      <RoleLandingHub />

      {/* Top Banner Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#14532D', letterSpacing: '-0.5px' }}>
            Executive Operations Console
          </div>
          <Text as="p" variant="caption" color="#64748B">
            Real-time multi-vendor performance, order status pipeline, and sales telemetry
          </Text>
        </div>
      </div>

      {!isConnected ? (
        <Text as="p" variant="caption" color="#D97706">
          Offline — showing cached summary when available.
        </Text>
      ) : null}

      {/* Date Filter Card */}
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
                      screen: 'dashboard',
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

      {/* Primary KPI Grid */}
      {forbidden ? (
        <PermissionDenied description="Server denied analytics for your role (FORBIDDEN)." />
      ) : query.isLoading && !query.data ? (
        <DashboardKpiSkeleton />
      ) : (
        <KpiGrid
          summary={
            query.data ?? {
              totalOrders: 0,
              totalRevenue: 0,
              activeRestaurants: 0,
              activeDeliveryPartners: 0,
              newCustomers: 0,
              avgOrderValue: 0,
            }
          }
        />
      )}

      {/* 3. Recharts Gross Marketplace Volume & Admin Earnings Graph */}
      <SalesAnalyticsChart />

      {/* 4. Top Performing Restaurants & Popular Food Items */}
      <TopPerformersWidget />

      {/* 5. Live Recent Orders Table Widget */}
      <RecentOrdersTableWidget />

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

