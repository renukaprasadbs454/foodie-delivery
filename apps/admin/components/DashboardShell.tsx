'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, EmptyState } from 'foodie-shared-web';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAdminRole } from '@/features/auth/authSlice';
import { logoutAdmin } from '@/features/auth/session';
import { filterNavForRole } from '@/lib/routeGuards';

/**
 * Dashboard chrome — System Design §5.3 / P2-AUTH-04 logout + P2-ADM-02 nav.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const role = useAppSelector(selectAdminRole);
  const nav = filterNavForRole(role);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    await logoutAdmin(dispatch);
    router.replace('/login');
    setLoggingOut(false);
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <aside
        style={{
          borderRight: '1px solid var(--color-border, #e5e5e5)',
          padding: 16,
          background: 'var(--color-surface, #fafafa)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontWeight: 700 }}>Foodie Admin</div>
        <nav aria-label="Admin" style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {nav.map((item) => (
              <li key={item.href} style={{ marginBottom: 8 }}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <Button
          label="Log out"
          aria-label="Log out"
          variant="secondary"
          loading={loggingOut}
          disabled={loggingOut}
          onClick={() => {
            void onLogout();
          }}
        />
      </aside>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}

export function FoundationPlaceholder({ title }: { title: string }) {
  return (
    <EmptyState
      title={title}
      description="Foundation scaffold only. Feature UI is Phase 2."
      aria-label={`${title} foundation placeholder`}
    />
  );
}
