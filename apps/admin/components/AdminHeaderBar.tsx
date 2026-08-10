'use client';

import React, { useState } from 'react';
import { ModuleSwitcher } from '@/components/ModuleSwitcher';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';

interface AdminHeaderBarProps {
  role: string | null;
  onLogout: () => void;
  loggingOut: boolean;
}

export function AdminHeaderBar({ role, onLogout, loggingOut }: AdminHeaderBarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  return (
    <>
      <header
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        {/* Left Side: Search & Module Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Global Search Quick Launcher */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 14px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              color: '#64748B',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              minWidth: 260,
              transition: 'border-color 0.15s ease',
            }}
          >
            <span>🔍</span>
            <span style={{ flex: 1, textAlign: 'left' }}>Search console...</span>
            <kbd style={{ fontSize: 10, fontWeight: 700, backgroundColor: '#E2E8F0', color: '#475569', padding: '2px 6px', borderRadius: 4 }}>
              ⌘K
            </kbd>
          </button>

          {/* Module Switcher */}
          <ModuleSwitcher />
        </div>

        {/* Right Side: Status, Alerts & Admin Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* API Health Status indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              color: '#166534',
              backgroundColor: '#DCFCE7',
              padding: '4px 10px',
              borderRadius: 20,
            }}
            title="System Services Operational"
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#22C55E' }} className="pulse-live" />
            <span>API Online</span>
          </div>

          {/* Sound Alert Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 8,
              border: soundEnabled ? '1px solid #FEF3C7' : '1px solid #E2E8F0',
              backgroundColor: soundEnabled ? '#FEF3C7' : '#F8FAFC',
              color: soundEnabled ? '#D97706' : '#64748B',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title={soundEnabled ? 'Live Order Sound Alerts Enabled' : 'Sound Alerts Muted'}
          >
            <span>{soundEnabled ? '🔔 Sound ON' : '🔕 Muted'}</span>
          </button>

          {/* Profile Dropdown Area */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '4px 8px',
                borderRadius: 20,
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#14532D',
                  color: '#F59E0B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 13,
                  border: '2px solid #F59E0B',
                }}
              >
                {role ? role.substring(0, 2) : 'AD'}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#14532D' }}>{role ?? 'Admin'}</div>
                <div style={{ fontSize: 10, color: '#64748B' }}>Super Console</div>
              </div>
              <span style={{ fontSize: 10, color: '#64748B' }}>▼</span>
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen ? (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '110%',
                  width: 220,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                  border: '1px solid #E2E8F0',
                  padding: '8px 0',
                  zIndex: 50,
                }}
              >
                <div style={{ padding: '8px 16px', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: 11, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700 }}>Logged in as</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#14532D' }}>{role ?? 'Admin'}</div>
                </div>
                <div style={{ padding: '4px 0' }}>
                  <a
                    href="/analytics"
                    style={{ display: 'block', padding: '8px 16px', fontSize: 13, color: '#334155' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    📊 Executive Analytics
                  </a>
                  <a
                    href="/audit-log"
                    style={{ display: 'block', padding: '8px 16px', fontSize: 13, color: '#334155' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    🛡️ System Audit Logs
                  </a>
                </div>
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 4 }}>
                  <button
                    type="button"
                    disabled={loggingOut}
                    onClick={onLogout}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 16px',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#DC2626',
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FEF2F2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {loggingOut ? 'Logging out...' : '🚪 Log out'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
