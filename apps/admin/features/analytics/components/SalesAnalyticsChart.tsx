'use client';

import React, { useState } from 'react';
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

interface ChartDataPoint {
  date: string;
  sales: number;
  commission: number;
}

const MOCK_CHART_DATA: ChartDataPoint[] = [
  { date: 'Mon', sales: 1240, commission: 186 },
  { date: 'Tue', sales: 1890, commission: 283 },
  { date: 'Wed', sales: 2390, commission: 358 },
  { date: 'Thu', sales: 3490, commission: 523 },
  { date: 'Fri', sales: 4200, commission: 630 },
  { date: 'Sat', sales: 5100, commission: 765 },
  { date: 'Sun', sales: 4800, commission: 720 },
];

export function SalesAnalyticsChart() {
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

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
        height: 380,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#14532D' }}>
            📈 Gross Marketplace Volume & Admin Earnings
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            Revenue vs 15% Marketplace Platform Commission
          </div>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', gap: 6, backgroundColor: '#F8FAFC', padding: 4, borderRadius: 8, border: '1px solid #E2E8F0' }}>
          <button
            type="button"
            onClick={() => setViewMode('weekly')}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: viewMode === 'weekly' ? '#14532D' : 'transparent',
              color: viewMode === 'weekly' ? '#F59E0B' : '#64748B',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: 'none',
              backgroundColor: viewMode === 'monthly' ? '#14532D' : 'transparent',
              color: viewMode === 'monthly' ? '#F59E0B' : '#64748B',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, width: '100%', minHeight: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={MOCK_CHART_DATA} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val}`} />
            <Tooltip
              formatter={(value: any) => [`$${Number(value ?? 0).toLocaleString()}`, '']}
              contentStyle={{ backgroundColor: '#0F3D21', borderRadius: 8, color: '#FFFFFF', border: 'none' }}
              labelStyle={{ fontWeight: 700, color: '#F59E0B' }}
            />
            <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12 }} />
            <Area
              type="monotone"
              dataKey="sales"
              name="Gross Sales Volume ($)"
              stroke="#14532D"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#salesGrad)"
            />
            <Area
              type="monotone"
              dataKey="commission"
              name="Admin Commission ($)"
              stroke="#F59E0B"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#commGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
