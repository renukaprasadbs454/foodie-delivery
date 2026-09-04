'use client';

import React, { type ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAdminRole, selectUserId } from '@/features/auth/authSlice';
import { logoutAdmin } from '@/features/auth/session';

interface DarkstoreShellProps {
  children: ReactNode;
}

export function DarkstoreShell({ children }: DarkstoreShellProps) {
  const role = useAppSelector(selectAdminRole);
  const userId = useAppSelector(selectUserId);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const DARKSTORE_LOCATIONS = [
    { id: 'ds-ind-101', name: 'Indiranagar QuickHub', code: 'DS-IND-101', state: 'Karnataka' },
    { id: 'ds-kor-102', name: 'Koramangala Express Hub', code: 'DS-KOR-102', state: 'Karnataka' },
    { id: 'ds-bnd-201', name: 'Bandra West Commerce Hub', code: 'DS-BND-201', state: 'Maharashtra' },
    { id: 'ds-del-301', name: 'Connaught Place Hub', code: 'DS-DEL-301', state: 'Delhi NCR' },
  ];

  const getSavedDarkstore = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('foodie_active_darkstore') || 'ds-ind-101';
    }
    return 'ds-ind-101';
  };

  const [selectedDarkstoreId, setSelectedDarkstoreId] = useState<string>(getSavedDarkstore);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleDarkstoreChange = (id: string) => {
    setSelectedDarkstoreId(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('foodie_active_darkstore', id);
    }
    const target = DARKSTORE_LOCATIONS.find((loc) => loc.id === id);
    if (target) {
      setToastMsg(`Switched Active Darkstore Location to ${target.name} (${target.code})`);
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const [isOpenStatus, setIsOpenStatus] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const onLogout = async () => {
    setLoggingOut(true);
    await logoutAdmin(dispatch);
    router.replace('/login');
    setLoggingOut(false);
  };

  const navItems = [
    { href: '/darkstore-admin/dashboard', label: 'Dashboard' },
    { href: '/darkstore-admin/orders', label: 'Orders', badge: 'LIVE' },
    { href: '/darkstore-admin/picking', label: 'Picking' },
    { href: '/darkstore-admin/packing', label: 'Packing' },
    { href: '/darkstore-admin/dispatch', label: 'Dispatch' },
    { href: '/darkstore-admin/inventory', label: 'Inventory' },
    { href: '/darkstore-admin/hierarchy', label: 'Hierarchy & Setup' },
    { href: '/darkstore-admin/grn', label: 'Warehouse GRN Entry' },
    { href: '/darkstore-admin/staff', label: 'Staff' },
    { href: '/darkstore-admin/darkstore', label: 'Darkstore Profile' },
    { href: '/darkstore-admin/reports', label: 'Reports' },
    { href: '/darkstore-admin/notifications', label: 'Notifications' },
    { href: '/darkstore-admin/settings', label: 'Settings' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 74,
            right: 24,
            backgroundColor: '#0F3D21',
            color: '#F59E0B',
            padding: '12px 20px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 800,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            zIndex: 9999,
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Top Header Bar */}
      <header
        style={{
          height: 64,
          backgroundColor: '#0F3D21',
          color: '#FFFFFF',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        {/* Brand & Interactive Darkstore Location Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.5px' }}>
            Foodiee <span style={{ color: '#F59E0B' }}>QuickStore</span>
          </div>
          <div
            style={{
              backgroundColor: '#14532D',
              border: '1.5px solid rgba(245, 158, 11, 0.4)',
              borderRadius: 8,
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <label htmlFor="darkstore-location-select" style={{ color: '#A7F3D0', fontWeight: 800, whiteSpace: 'nowrap' }}>
              Darkstore:
            </label>
            <select
              id="darkstore-location-select"
              value={selectedDarkstoreId}
              onChange={(e) => handleDarkstoreChange(e.target.value)}
              style={{
                backgroundColor: '#0F3D21',
                color: '#F59E0B',
                border: '1px solid #10B981',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {DARKSTORE_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code}) - {loc.state}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Header Status & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Store Open/Closed Toggle */}
          <button
            type="button"
            onClick={() => setIsOpenStatus(!isOpenStatus)}
            style={{
              backgroundColor: isOpenStatus ? '#DCFCE7' : '#FEE2E2',
              color: isOpenStatus ? '#15803D' : '#B91C1C',
              border: 'none',
              borderRadius: 20,
              padding: '6px 14px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isOpenStatus ? '#16A34A' : '#DC2626',
              }}
            />
            {isOpenStatus ? 'STORE OPEN' : 'STORE CLOSED'}
          </button>

          {/* User Profile */}
          <div style={{ fontSize: 13, textAlign: 'right' }}>
            <div style={{ fontWeight: 800, color: '#FFFFFF' }}>Darkstore Admin</div>
            <div style={{ fontSize: 11, color: '#A7F3D0' }}>Role: {role || 'DARKSTORE_ADMIN'}</div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </header>

      {/* Sidebar + Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1 }}>
        {/* Left Operational Sidebar */}
        <aside
          style={{
            backgroundColor: '#0F3D21',
            color: '#FFFFFF',
            padding: '20px 12px',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <nav aria-label="Darkstore Operations">
            <div style={{ fontSize: 10, color: '#A7F3D0', fontWeight: 800, textTransform: 'uppercase', paddingLeft: 12, marginBottom: 10 }}>
              Darkstore Operations
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/darkstore-admin/dashboard' && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: isActive ? 800 : 600,
                        color: isActive ? '#FFFFFF' : '#D1D5DB',
                        backgroundColor: isActive ? '#14532D' : 'transparent',
                        borderLeft: isActive ? '4px solid #F59E0B' : '4px solid transparent',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            backgroundColor: '#F59E0B',
                            color: '#0F3D21',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div style={{ padding: 12, backgroundColor: '#14532D', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', marginTop: 20 }}>
            <div style={{ fontSize: 11, color: '#A7F3D0', fontWeight: 800 }}> Operational Hotline</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF', marginTop: 2 }}>+91 98000 11223</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Quick-commerce SLA: Sub 15-min delivery</div>
          </div>
        </aside>

        {/* Main Operational Workspace Content */}
        <main style={{ flex: 1, backgroundColor: '#F8FAFC' }}>{children}</main>
      </div>
    </div>
  );
}
