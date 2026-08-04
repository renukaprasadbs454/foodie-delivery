'use client';

import React from 'react';
import { DataTableShell, EmptyState, Text, useTheme } from 'foodie-shared-web';
import type { OrderStatusMetric } from '../types';
import { formatCount, formatPercent } from '../types';

type Props = {
  metrics: OrderStatusMetric[];
};

/** Order status mix table — §14.3 fields. */
export function OrderStatusTable({ metrics }: Props) {
  const { tokens } = useTheme();

  if (metrics.length === 0) {
    return (
      <EmptyState
        title="No status metrics"
        description="No orders in this range."
        aria-label="Order status empty"
      />
    );
  }

  return (
    <DataTableShell
      caption="Order status metrics"
      headers={['Status', 'Count', '% of total']}
    >
      {metrics.map((row) => (
        <tr key={row.status}>
          <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
            <Text as="span" variant="body">
              {row.status}
            </Text>
          </td>
          <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
            <Text as="span" variant="body">
              {formatCount(row.count)}
            </Text>
          </td>
          <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
            <Text as="span" variant="body">
              {formatPercent(row.percentageOfTotal)}
            </Text>
          </td>
        </tr>
      ))}
    </DataTableShell>
  );
}
