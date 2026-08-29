'use client';

import React, { type ReactNode } from 'react';
import { usePermissions } from '@/context/PermissionContext';

interface HasPermissionProps {
  permission?: string;
  anyPermission?: string[];
  fallback?: ReactNode;
  children: ReactNode;
}

export function HasPermission({
  permission,
  anyPermission,
  fallback = null,
  children,
}: HasPermissionProps) {
  const { hasPermission, hasAnyPermission, loading } = usePermissions();

  if (loading) return null;

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (anyPermission && !hasAnyPermission(anyPermission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
