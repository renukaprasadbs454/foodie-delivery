'use client';

import React from 'react';
import { Skeleton, useTheme } from 'foodie-shared-web';

export function OrderDetailSkeleton() {
  const { tokens } = useTheme();
  return (
    <div
      aria-label="Order details loading"
      style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}
    >
      <Skeleton.Block width="45%" height={28} />
      <Skeleton.Block width="100%" height={140} />
      <Skeleton.Block width="100%" height={100} />
    </div>
  );
}
