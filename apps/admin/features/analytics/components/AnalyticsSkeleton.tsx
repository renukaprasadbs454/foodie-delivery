'use client';

import React from 'react';
import { Skeleton, useTheme } from 'foodie-shared-web';

/** Analytics charts/table skeleton. */
export function AnalyticsSkeleton() {
  const { tokens } = useTheme();
  return (
    <div
      aria-label="Analytics loading"
      style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}
    >
      <Skeleton.Block width="100%" height={220} />
      <Skeleton.Block width="100%" height={160} />
    </div>
  );
}
