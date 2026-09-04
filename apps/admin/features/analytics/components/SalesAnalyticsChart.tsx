'use client';

import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useGetDailySalesQuery } from '@/api/endpoints/analyticsApi';
import { defaultDateRange, type AnalyticsDateRange } from '../types';

interface Props {
  range?: AnalyticsDateRange;
}

export function SalesAnalyticsChart({ range }: Props) {
  const queryRange = useMemo(() => range ?? defaultDateRange(), [range]);
  const { data: rawSalesData } = useGetDailySalesQuery(queryRange);

  const chartData = useMemo(() => {
    if (!rawSalesData || rawSalesData.length === 0) return [];
    return rawSalesData.map((p) => {
      const rev = Number(p.revenue) || 0;
      return {
        date: p.date,
        sales: rev,
        commission: Math.round(rev * 0.15 * 100) / 100,
      };
    });
  }, [rawSalesData]);

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: '22px 24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 14px 0 rgba(20, 83, 45, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minHeight: 320,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#14532D' }}>
            Gross Marketplace Volume & Admin Earnings
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            Revenue vs 15% Marketplace Platform Commission
          </div>
        </div>
      </div>

      {/* Chart Content */}
      <div style={{ flex: 1, width: '100%', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {chartData.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748B', fontSize: 13, padding: 32 }}>
            No sales volume recorded for the selected date range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14532D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14532D" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val}`} />
              <Tooltip
                formatter={(value: any) => [`₹${Number(value ?? 0).toLocaleString()}`, '']}
                contentStyle={{ backgroundColor: '#0F3D21', borderRadius: 8, color: '#FFFFFF', border: 'none' }}
                labelStyle={{ fontWeight: 700, color: '#F59E0B' }}
              />
              <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
              <Area
                type="monotone"
                dataKey="sales"
                name="Gross Sales Volume (₹)"
                stroke="#14532D"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#salesGrad)"
              />
              <Area
                type="monotone"
                dataKey="commission"
                name="Admin Commission (₹)"
                stroke="#F59E0B"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#commGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
