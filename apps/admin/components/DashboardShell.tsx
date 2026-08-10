'use client';

import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { EmptyState } from 'foodie-shared-web';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAdminRole } from '@/features/auth/authSlice';
import { logoutAdmin } from '@/features/auth/session';
import { filterNavForRole, type NavCategory, type NavItem } from '@/lib/routeGuards';
import { AdminHeaderBar } from '@/components/AdminHeaderBar';
import { AiAssistantWidget } from '@/components/AiAssistantWidget';
import { AdminFooter } from '@/components/AdminFooter';

/**
 * Dashboard chrome — 6amMart Multi-Vendor Executive Design.
 */
export function DashboardShell({ children }: { children: ReactNode }) {
  const role = useAppSelector(selectAdminRole);
  const nav = filterNavForRole(role);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = React.useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    await logoutAdmin(dispatch);
    router.replace('/login');
    setLoggingOut(false);
  };

  // Group navigation items by category
  const categories: NavCategory[] = ['MAIN', 'BUSINESS MANAGERS', 'ORDER HUB', 'FINANCE & MARKETING', 'SYSTEM'];
  const groupedNav = categories.reduce<Record<string, NavItem[]>>((acc, cat) => {
    acc[cat] = nav.filter((item) => item.category === cat);
    return acc;
  }, {});

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#F8FAFC',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '270px 1fr',
          flex: 1,
        }}
      >
        {/* Sidebar Navigation */}
        <aside
          style={{
            backgroundColor: '#0F3D21',
            color: '#FFFFFF',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '4px 0 16px rgba(0,0,0,0.1)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Brand Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px' }}>
                  Admin <span style={{ color: '#F59E0B' }}>Panel</span>
                </div>
                <span style={{ fontSize: 22 }} title="Admin Console">
                  👑
                </span>
              </div>
            </div>

            {/* Role Badge */}
            {role ? (
              <div
                style={{
                  backgroundColor: '#14532D',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: 10, color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                    Active Role
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>{role}</div>
                </div>
                <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: '#F59E0B' }} className="pulse-live" />
              </div>
            ) : null}

            {/* Navigation Links */}
            <nav aria-label="Admin" style={{ flex: 1, overflowY: 'auto' }}>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {nav.map((item) => {
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 12px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? '#0F3D21' : '#E6F4EA',
                          backgroundColor: isActive ? '#FEF3C7' : 'transparent',
                          borderLeft: isActive ? '4px solid #F59E0B' : '4px solid transparent',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease-in-out',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 16 }}>{item.icon ?? '📌'}</span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge ? (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: isActive ? '#14532D' : '#F59E0B',
                              backgroundColor: isActive ? 'rgba(20,83,45,0.15)' : 'rgba(245, 158, 11, 0.2)',
                              padding: '2px 6px',
                              borderRadius: 6,
                            }}
                          >
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Bottom User Profile & Logout */}
          <div
            style={{
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#14532D',
                color: '#F59E0B',
                border: '2px solid #F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              👑
            </div>
            <button
              type="button"
              aria-label="Log out"
              disabled={loggingOut}
              onClick={() => {
                void onLogout();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#F59E0B',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {loggingOut ? 'Logging out...' : 'Log out'}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowX: 'hidden' }}>
          {/* Top Header Bar */}
          <AdminHeaderBar role={role} onLogout={() => void onLogout()} loggingOut={loggingOut} />

          {/* Page Content Container */}
          <main style={{ padding: '28px 32px', flex: 1, backgroundColor: '#F8FAFC' }}>{children}</main>
        </div>
      </div>

      {/* Full-width Executive Admin Footer */}
      <AdminFooter />

      {/* Foodie AI Operations Assistant Floating Widget */}
      <AiAssistantWidget />
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

