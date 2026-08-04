'use client';

import React from 'react';
import { Skeleton, useTheme } from 'foodie-shared-web';

/** Dashboard KPI skeleton — UI-API DashboardKpiSkeleton. */
export function DashboardKpiSkeleton() {
  const { tokens } = useTheme();
  return (
    <div
      aria-label="Dashboard loading"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: tokens.spacing.md,
      }}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            padding: tokens.spacing.md,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.md,
            display: 'flex',
            flexDirection: 'column',
            gap: tokens.spacing.sm,
          }}
        >
          <Skeleton.Block width="50%" height={14} />
          <Skeleton.Block width="70%" height={28} />
        </div>
      ))}
    </div>
  );
}
