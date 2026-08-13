'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';

interface AdminHeaderBarProps {
  role?: string | null;
  onLogout?: () => void;
  loggingOut?: boolean;
  isCompact?: boolean;
  onToggleCompact?: () => void;
}

type PolicyTab = 'ABOUT' | 'PRIVACY' | 'TERMS' | 'CONTACT' | null;

export function AdminHeaderBar({
  isCompact = false,
  onToggleCompact,
}: AdminHeaderBarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Active Policy / Info Modal State
  const [activeModalTab, setActiveModalTab] = useState<PolicyTab>(null);

  const renderModalContent = () => {
    switch (activeModalTab) {
      case 'ABOUT':
        return {
          title: 'ℹ️ About us',
          subtitle: 'Enterprise Hyperlocal Multi-Vendor Platform',
          body: (
            <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#334155' }}>
              <p style={{ margin: '0 0 12px 0' }}>
                Foodie Admin is the centralized operational console for managing hyperlocal food delivery networks, cloud kitchens, bakeries, cafes, and courier logistics.
              </p>
              <p style={{ margin: 0 }}>
                Powered by a robust Spring Boot microservice backend and Next.js frontend, Foodie connects customers, restaurants, and delivery dispatchers with real-time order tracking and automated payout management.
              </p>
            </div>
          ),
        };
      case 'PRIVACY':
        return {
          title: '🔒 Privacy policy',
          subtitle: 'Enterprise Data Security & Privacy Guidelines',
          body: (
            <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#334155' }}>
              <p style={{ margin: '0 0 10px 0' }}>
                We prioritize user and merchant privacy with strict compliance standards:
              </p>
              <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>All network communications are secured with 256-bit SSL encryption.</li>
                <li>Delivery driver KYC documents are stored securely with temporary signed URLs.</li>
                <li>Payment transaction data complies with strict PCI-DSS guidelines.</li>
              </ul>
            </div>
          ),
        };
      case 'TERMS':
        return {
          title: '📜 Terms and condition',
          subtitle: 'Operational Rules & Platform Terms of Service',
          body: (
            <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#334155' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <strong>Merchant Terms:</strong> Restaurants agree to keep menu items and availability updated in real-time.
                </div>
                <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <strong>Delivery Partner Agreement:</strong> Delivery partners earn minimum guaranteed payouts per assignment or per-kilometer rates (whichever is greater).
                </div>
                <div style={{ padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <strong>Order Fulfillment:</strong> Order cancellations and refund policies follow standard platform SLAs.
                </div>
              </div>
            </div>
          ),
        };
      case 'CONTACT':
        return {
          title: '📞 Contact us',
          subtitle: 'Operations & Technical Support Desk',
          body: (
            <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#334155' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div><strong>Phone Support:</strong> +91 98765 43210</div>
                <div><strong>Email:</strong> support@foodie.com</div>
                <div><strong>Headquarters:</strong> Foodie HQ, Level 2, Avenue 11, Bangalore 560103, India</div>
                <div style={{ backgroundColor: '#ECFDF5', padding: '12px', borderRadius: '8px', border: '1px solid #A7F3D0', color: '#065F46', fontWeight: 600 }}>
                  Need operational assistance? Click Support Ticket in the footer to submit an instant ticket to our dispatch desk.
                </div>
              </div>
            </div>
          ),
        };
      default:
        return null;
    }
  };

  const modalDetails = renderModalContent();

  return (
    <>
      <header
        className="admin-header-responsive"
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Left Side: Sidebar Toggle & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
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
              gap: 8,
              padding: '8px 12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              color: '#64748B',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              maxWidth: '100%',
              transition: 'border-color 0.15s ease',
            }}
          >
            <span>🔍</span>
            <span style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>Search console...</span>
            <kbd className="hide-mobile-kbd" style={{ fontSize: 10, fontWeight: 700, backgroundColor: '#E2E8F0', color: '#475569', padding: '2px 6px', borderRadius: 4 }}>
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Center/Right: Top Navbar Features (Home | About us | Privacy policy | Terms and condition | Contact us) */}
        <nav
          className="top-navbar-scroll"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            fontSize: 14,
            fontWeight: 600,
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            padding: '4px 0',
            maxWidth: '100%',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <Link
            href="/"
            style={{
              color: '#10B981',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: 14,
              transition: 'color 0.15s ease',
            }}
          >
            Home
          </Link>

          <button
            type="button"
            onClick={() => setActiveModalTab('ABOUT')}
            style={{
              background: 'none',
              border: 'none',
              color: activeModalTab === 'ABOUT' ? '#10B981' : '#475569',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              padding: 0,
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#10B981')}
            onMouseLeave={(e) => (e.currentTarget.style.color = activeModalTab === 'ABOUT' ? '#10B981' : '#475569')}
          >
            About us
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('PRIVACY')}
            style={{
              background: 'none',
              border: 'none',
              color: activeModalTab === 'PRIVACY' ? '#10B981' : '#475569',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              padding: 0,
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#10B981')}
            onMouseLeave={(e) => (e.currentTarget.style.color = activeModalTab === 'PRIVACY' ? '#10B981' : '#475569')}
          >
            Privacy policy
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('TERMS')}
            style={{
              background: 'none',
              border: 'none',
              color: activeModalTab === 'TERMS' ? '#10B981' : '#475569',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              padding: 0,
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#10B981')}
            onMouseLeave={(e) => (e.currentTarget.style.color = activeModalTab === 'TERMS' ? '#10B981' : '#475569')}
          >
            Terms and condition
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('CONTACT')}
            style={{
              background: 'none',
              border: 'none',
              color: activeModalTab === 'CONTACT' ? '#10B981' : '#475569',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              padding: 0,
              transition: 'color 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#10B981')}
            onMouseLeave={(e) => (e.currentTarget.style.color = activeModalTab === 'CONTACT' ? '#10B981' : '#475569')}
          >
            Contact us
          </button>
        </nav>
      </header>

      {/* Global Search Dialog Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Policy & Information Modal */}
      {activeModalTab && modalDetails ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setActiveModalTab(null)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              color: '#1E293B',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
                  {modalDetails.title}
                </h3>
                <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0 0' }}>
                  {modalDetails.subtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalTab(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 20 }}>
              {modalDetails.body}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setActiveModalTab(null)}
                style={{
                  padding: '8px 20px',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        @media (max-width: 640px) {
          .admin-header-responsive {
            padding: 10px 14px !important;
          }
          .hide-mobile-kbd {
            display: none !important;
          }
          .top-navbar-scroll {
            order: 3;
            width: 100%;
            border-top: 1px solid #F1F5F9;
            padding-top: 8px !important;
            margin-top: 4px;
          }
        }
      `}</style>
    </>
  );
}
