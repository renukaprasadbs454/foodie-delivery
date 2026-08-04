'use client';

import React, { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { EmptyState, Text, useTheme } from 'foodie-shared-web';
import type { DailySalesPoint } from '../types';

type Props = {
  points: DailySalesPoint[];
};

/**
 * Daily sales chart — loaded only via dynamic import (SD §25 code-split).
 */
export default function DailySalesChart({ points }: Props) {
  const { tokens } = useTheme();
  const data = useMemo(
    () =>
      points.map((p) => ({
        date: p.date,
        orderCount: Number(p.orderCount) || 0,
        revenue: Number(p.revenue) || 0,
      })),
    [points],
  );

  if (data.length === 0) {
    return (
      <EmptyState
        title="No sales in range"
        description="Try a wider date range."
        aria-label="Daily sales empty"
      />
    );
  }

  return (
    <div style={{ width: '100%', height: 280 }} aria-label="Daily sales chart">
      <Text as="h3" variant="heading3" style={{ marginBottom: tokens.spacing.sm }}>
        Daily sales
      </Text>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <CartesianGrid stroke={tokens.color.border} strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="orderCount"
            name="Orders"
            stroke={tokens.color.accent}
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="revenue"
            name="Revenue"
            stroke={tokens.color.textSecondary}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
