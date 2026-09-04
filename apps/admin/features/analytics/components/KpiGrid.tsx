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
  icon,
  trend,
}: {
  label: string;
  children: React.ReactNode;
  icon?: string;
  trend?: string;
}) {
  return (
    <div
      className="card-hover"
      style={{
        padding: '20px 22px',
        border: '1px solid #E2E8F0',
        borderLeft: '4px solid #F59E0B',
        borderRadius: 14,
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: '0 4px 14px 0 rgba(20, 83, 45, 0.04)',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text as="span" variant="caption" color="#64748B" style={{ fontSize: 13, fontWeight: 600 }}>
          {label}
        </Text>
        {icon ? (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#F0FDF4',
              border: '1px solid #DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            {icon}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4 }}>
        {children}
        {trend ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#166534',
              backgroundColor: '#DCFCE7',
              padding: '2px 8px',
              borderRadius: 12,
            }}
          >
            {trend}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** Summary KPI tiles — 6amMart Multi-Vendor metrics. */
export function KpiGrid({ summary }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 16,
      }}
    >
      <KpiCard label="Total Orders">
        <Text as="span" variant="heading2" color="#14532D">
          {formatCount(summary.totalOrders)}
        </Text>
      </KpiCard>
      <KpiCard label="Total Marketplace Revenue">
        <MoneyText value={summary.totalRevenue} aria-label="Total revenue" />
      </KpiCard>
      <KpiCard label="Active Stores / Vendors">
        <Text as="span" variant="heading2" color="#14532D">
          {formatCount(summary.activeRestaurants)}
        </Text>
      </KpiCard>
      <KpiCard label="Active Delivery Fleet">
        <Text as="span" variant="heading2" color="#14532D">
          {formatCount(summary.activeDeliveryPartners)}
        </Text>
      </KpiCard>
      <KpiCard label="New Registered Customers">
        <Text as="span" variant="heading2" color="#14532D">
          {formatCount(summary.newCustomers)}
        </Text>
      </KpiCard>
      <KpiCard label="Average Order Value">
        <MoneyText value={summary.avgOrderValue} aria-label="Average order value" />
      </KpiCard>
    </div>
  );
}

