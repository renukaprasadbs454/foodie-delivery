'use client';

import React, { useState } from 'react';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';

interface AdminHeaderBarProps {
  role: string | null;
  onLogout: () => void;
  loggingOut: boolean;
  isCompact?: boolean;
  onToggleCompact?: () => void;
}

export function AdminHeaderBar({
  role,
  onLogout,
  loggingOut,
  isCompact = false,
  onToggleCompact,
}: AdminHeaderBarProps) {
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
        {/* Left Side: Sidebar Toggle & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Hamburger Icon Toggle Button */}
          {onToggleCompact ? (
            <button
              type="button"
              onClick={onToggleCompact}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 38,
                height: 38,
                borderRadius: 10,
                border: isCompact ? '1px solid #F59E0B' : '1px solid #E2E8F0',
                backgroundColor: isCompact ? '#FEF3C7' : '#F8FAFC',
                color: isCompact ? '#D97706' : '#334155',
                fontSize: 18,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              aria-label="Toggle sidebar compact mode"
              title={isCompact ? 'Expand sidebar (Pin)' : 'Collapse sidebar (Hover to peek panel)'}
            >
              ☰
            </button>
          ) : null}

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
        </div>

        {/* Right Side: Status & Admin Profile */}
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
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 8, paddingBottom: 4, paddingLeft: 16, paddingRight: 16 }}>
                  {/* Sound Alert Toggle inside Profile Menu */}
                  <button
                    type="button"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
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
                    <span style={{ fontSize: 10 }}>Toggle</span>
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
