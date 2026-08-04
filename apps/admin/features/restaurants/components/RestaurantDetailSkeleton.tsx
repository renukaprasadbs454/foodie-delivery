'use client';

import React from 'react';
import { Skeleton, useTheme } from 'foodie-shared-web';

export function RestaurantDetailSkeleton() {
  const { tokens } = useTheme();
  return (
    <div
      aria-label="Restaurant details loading"
      style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}
    >
      <Skeleton.Block width="40%" height={28} />
      <Skeleton.Block width="100%" height={120} />
      <Skeleton.Block width="100%" height={80} />
    </div>
  );
}
