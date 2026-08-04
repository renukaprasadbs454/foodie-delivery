'use client';

import React from 'react';
import { Text, useTheme } from 'foodie-shared-web';
import type { DashboardSummary } from '../types';
import { formatCount } from '../types';
import { MoneyText } from './MoneyText';

type Props = {
  summary: DashboardSummary;
};

function KpiCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const { tokens } = useTheme();
  return (
    <div
      style={{
        padding: tokens.spacing.md,
        border: `1px solid ${tokens.color.border}`,
        borderRadius: tokens.radius.md,
        background: tokens.color.surface,
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing.xs,
      }}
    >
      <Text as="span" variant="caption" color={tokens.color.textSecondary}>
        {label}
      </Text>
      {children}
    </div>
  );
}

/** Summary KPI tiles — contracted §14.1 fields only. */
export function KpiGrid({ summary }: Props) {
  const { tokens } = useTheme();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: tokens.spacing.md,
      }}
    >
      <KpiCard label="Total orders">
        <Text as="span" variant="heading3">
          {formatCount(summary.totalOrders)}
        </Text>
      </KpiCard>
      <KpiCard label="Total revenue">
        <MoneyText value={summary.totalRevenue} aria-label="Total revenue" />
      </KpiCard>
      <KpiCard label="Active restaurants">
        <Text as="span" variant="heading3">
          {formatCount(summary.activeRestaurants)}
        </Text>
      </KpiCard>
      <KpiCard label="Active delivery partners">
        <Text as="span" variant="heading3">
          {formatCount(summary.activeDeliveryPartners)}
        </Text>
      </KpiCard>
      <KpiCard label="New customers">
        <Text as="span" variant="heading3">
          {formatCount(summary.newCustomers)}
        </Text>
      </KpiCard>
      <KpiCard label="Avg order value">
        <MoneyText value={summary.avgOrderValue} aria-label="Average order value" />
      </KpiCard>
    </div>
  );
}
