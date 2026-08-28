import React, { type ReactNode } from 'react';
import { DarkstoreShell } from '@/features/darkstore/components/DarkstoreShell';

export default function DarkstoreAdminLayout({ children }: { children: ReactNode }) {
  return <DarkstoreShell>{children}</DarkstoreShell>;
}
