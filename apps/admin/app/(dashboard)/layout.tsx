import React, { type ReactNode } from 'react';
import { DashboardShell } from '@/components/DashboardShell';

/**
 * Authenticated chrome — System Design §5.3 / Blueprint §2.3.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
