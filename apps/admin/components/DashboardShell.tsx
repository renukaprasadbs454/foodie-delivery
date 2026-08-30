'use client';

import React, { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, EmptyState, Text } from 'foodie-shared-web';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  clearSession,
  selectAdminRole,
  selectUserId,
  setSession,
} from '@/features/auth/authSlice';
import { useGetAdminMeQuery } from '@/api/endpoints/authApi';
import { logoutAdmin } from '@/features/auth/session';
import {
  filterNavForRole,
  getHomeRouteForRole,
  isRouteAllowedForRole,
} from '@/lib/routeGuards';
import { AdminHeaderBar } from '@/components/AdminHeaderBar';
import { AiAssistantWidget } from '@/components/AiAssistantWidget';
import { AdminFooter } from '@/components/AdminFooter';

export function DashboardShell({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const role = useAppSelector(selectAdminRole);
  const userId = useAppSelector(selectUserId);
  const [loggingOut, setLoggingOut] = React.useState(false);

  // Fetch current authenticated user profile from backend ME API
  const { data: meProfile, isError: isMeError, error: meError } = useGetAdminMeQuery(undefined, {
    skip: false,
  });

  useEffect(() => {
    if (meProfile) {
      dispatch(
        setSession({
          userId: meProfile.adminUserId,
          role: meProfile.role,
          userType: 'ADMIN',
          fullName: meProfile.fullName,
          permissions: meProfile.permissions || [],
        }),
      );
    } else if (isMeError) {
      const status = (meError as any)?.status;
      if (status === 401 || status === 403) {
        dispatch(clearSession());
        router.replace('/login');
      }
    }
  }, [meProfile, isMeError, meError, dispatch, router]);

  const nav = filterNavForRole(role);
  const isAllowedRoute = isRouteAllowedForRole(pathname, role);

  // Compact Hover-to-Peek Panel state
  const [isCompact, setIsCompact] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    await logoutAdmin(dispatch);
    router.replace('/login');
    setLoggingOut(false);
  };

  const isExpanded = !isCompact || isHovered;

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
          gridTemplateColumns: isCompact ? '72px 1fr' : '270px 1fr',
          transition: 'grid-template-columns 0.25s ease',
          flex: 1,
          position: 'relative',
        }}
      >
        {/* Sidebar Navigation */}
        <aside
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{
            position: isCompact && isHovered ? 'absolute' : 'relative',
            top: 0,
            bottom: 0,
            left: 0,
            zIndex: isCompact && isHovered ? 50 : 10,
            width: isExpanded ? 270 : 72,
            backgroundColor: '#0F3D21',
            color: '#FFFFFF',
            padding: isExpanded ? '24px 16px' : '24px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: isCompact && isHovered ? '8px 0 24px rgba(0,0,0,0.3)' : '4px 0 16px rgba(0,0,0,0.1)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), padding 0.25s ease, box-shadow 0.25s ease',
            overflowX: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Brand Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: isExpanded ? 'space-between' : 'center' }}>
                {isExpanded ? (
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
                    Admin <span style={{ color: '#F59E0B' }}>Panel</span>
                  </div>
                ) : (
                  <span style={{ fontSize: 22 }} title="Admin Console">
                    🍔
                  </span>
                )}
              </div>
            </div>

            {/* Role Badge */}
            {role ? (
              <div
                style={{
                  backgroundColor: '#14532D',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  borderRadius: 10,
                  padding: isExpanded ? '10px 14px' : '10px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isExpanded ? 'space-between' : 'center',
                }}
                title={`Active Role: ${role}`}
              >
                {isExpanded ? (
                  <div>
                    <div style={{ fontSize: 10, color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>
                      Active Role
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap' }}>{role}</div>
                  </div>
                ) : (
                  <span style={{ fontSize: 14 }}>🛡️</span>
                )}
                <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: '#F59E0B' }} className="pulse-live" />
              </div>
            ) : null}

            {/* Navigation Links */}
            <nav aria-label="Admin Navigation" style={{ flex: 1, overflowY: 'auto' }}>
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

                  const isHighlighted = item.highlighted ?? false;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={!isExpanded ? item.label : undefined}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isExpanded ? 'space-between' : 'center',
                          padding: isExpanded ? '9px 12px' : '10px 0',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: isActive || isHighlighted ? 800 : 500,
                          color: isActive
                            ? '#0F3D21'
                            : isHighlighted
                            ? '#FEF3C7'
                            : '#E6F4EA',
                          backgroundColor: isActive
                            ? '#FEF3C7'
                            : isHighlighted
                            ? 'rgba(245, 158, 11, 0.25)'
                            : 'transparent',
                          borderLeft: isExpanded
                            ? isActive || isHighlighted
                              ? '4px solid #F59E0B'
                              : '4px solid transparent'
                            : 'none',
                          textDecoration: 'none',
                          transition: 'all 0.15s ease-in-out',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>
                        </div>
                        {isExpanded && item.badge ? (
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
        </aside>

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowX: 'hidden' }}>
          {/* Top Header Bar */}
          <AdminHeaderBar
            role={role}
            userId={userId}
            onLogout={() => void onLogout()}
            loggingOut={loggingOut}
            isCompact={isCompact}
            onToggleCompact={() => setIsCompact((prev) => !prev)}
          />

          {/* Page Content Container / 403 Forbidden Gate */}
          <main style={{ padding: '28px 32px', flex: 1, backgroundColor: '#F8FAFC' }}>
            {!isAllowedRoute ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 400,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 40,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
                <Text as="h2" variant="heading1" style={{ fontSize: 22, fontWeight: 800, color: '#991B1B', marginBottom: 8 }}>
                  403 — Access Restricted
                </Text>
                <Text variant="body" style={{ color: '#475569', maxWidth: 460, marginBottom: 24, fontSize: 14 }}>
                  Your administrative account ({role || 'UNASSIGNED'}) is not authorized to access <strong>{pathname}</strong>.
                </Text>
                <Button
                  label={`Go to ${role ? role : 'Home'} Dashboard`}
                  aria-label={`Navigate to ${role ? role : 'Home'} dashboard`}
                  onClick={() => router.push(getHomeRouteForRole(role))}
                  style={{
                    backgroundColor: '#0F3D21',
                    color: '#FFFFFF',
                    padding: '10px 20px',
                    fontWeight: 700,
                    borderRadius: 8,
                  }}
                />
              </div>
            ) : (
              children
            )}
          </main>
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
