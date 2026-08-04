'use client';

import React from 'react';
import { EmptyState } from 'foodie-shared-web';

type Props = {
  title?: string;
  description?: string;
};

/**
 * Role-denied shell — SUPPORT / missing role must not see empty KPIs
 * (UI-API Dashboard acceptance).
 */
export function PermissionDenied({
  title = 'Permission denied',
  description = 'Your admin role cannot view analytics for this range.',
}: Props) {
  return (
    <EmptyState
      title={title}
      description={description}
      aria-label="Permission denied"
    />
  );
}
