'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { GlobalSearchModal } from '@/components/GlobalSearchModal';

interface AdminHeaderBarProps {
  role?: string | null;
  userId?: string | null;
  onLogout?: () => void;
  loggingOut?: boolean;
  isCompact?: boolean;
  onToggleCompact?: () => void;
}

type PolicyTab = 'ABOUT' | 'PRIVACY' | 'TERMS' | 'CONTACT' | null;

export function AdminHeaderBar({
  role,
  userId,
  onLogout,
  loggingOut = false,
  isCompact = false,
  onToggleCompact,
}: AdminHeaderBarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileDropdownRef = React.useRef<HTMLDivElement>(null);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  // Active Policy / Info Modal State
  const [activeModalTab, setActiveModalTab] =
    useState<PolicyTab>(null);

  /*
   * Close profile menu when clicking outside
   */
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      const clickedProfileButton =
        profileDropdownRef.current?.contains(target);

      const clickedProfileMenu =
        profileMenuRef.current?.contains(target);

      if (!clickedProfileButton && !clickedProfileMenu) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  /*
   * Modal Content
   */
  const renderModalContent = () => {
    switch (activeModalTab) {
      case 'ABOUT':
        return {
          title: 'ℹ About us',
          subtitle:
            'Enterprise Hyperlocal Multi-Vendor Platform',
          body: (
            <div
              style={{
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: '#334155',
              }}
            >
              <p style={{ margin: '0 0 12px 0' }}>
                Foodie Admin is the centralized operational
                console for managing hyperlocal food delivery
                networks, cloud kitchens, bakeries, cafes, and
                courier logistics.
              </p>

              <p style={{ margin: 0 }}>
                Powered by a robust Spring Boot microservice
                backend and Next.js frontend, Foodie connects
                customers, restaurants, and delivery dispatchers
                with real-time order tracking and automated
                payout management.
              </p>
            </div>
          ),
        };

      case 'PRIVACY':
        return {
          title: ' Privacy policy',
          subtitle:
            'Enterprise Data Security & Privacy Guidelines',
          body: (
            <div
              style={{
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: '#334155',
              }}
            >
              <p style={{ margin: '0 0 10px 0' }}>
                We prioritize user and merchant privacy with
                strict compliance standards:
              </p>

              <ul
                style={{
                  paddingLeft: '20px',
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <li>
                  All network communications are secured with
                  256-bit SSL encryption.
                </li>

                <li>
                  Delivery driver KYC documents are stored
                  securely with temporary signed URLs.
                </li>

                <li>
                  Payment transaction data complies with strict
                  PCI-DSS guidelines.
                </li>
              </ul>
            </div>
          ),
        };

      case 'TERMS':
        return {
          title: ' Terms and condition',
          subtitle:
            'Operational Rules & Platform Terms of Service',
          body: (
            <div
              style={{
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: '#334155',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    padding: '10px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <strong>Merchant Terms:</strong>{' '}
                  Restaurants agree to keep menu items and
                  availability updated in real-time.
                </div>

                <div
                  style={{
                    padding: '10px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <strong>
                    Delivery Partner Agreement:
                  </strong>{' '}
                  Delivery partners earn minimum guaranteed
                  payouts per assignment or per-kilometer rates
                  (whichever is greater).
                </div>

                <div
                  style={{
                    padding: '10px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <strong>Order Fulfillment:</strong>{' '}
                  Order cancellations and refund policies follow
                  standard platform SLAs.
                </div>
              </div>
            </div>
          ),
        };

      case 'CONTACT':
        return {
          title: ' Contact us',
          subtitle: 'Operations & Technical Support Desk',
          body: (
            <div
              style={{
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: '#334155',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div>
                  <strong>Phone Support:</strong>{' '}
                  +91 98765 43210
                </div>

                <div>
                  <strong>Email:</strong> support@foodie.com
                </div>

                <div>
                  <strong>Headquarters:</strong> Foodie HQ,
                  Level 2, Avenue 11, Bangalore 560103, India
                </div>

                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #A7F3D0',
                    color: '#065F46',
                    fontWeight: 600,
                  }}
                >
                  Need operational assistance? Click Support
                  Ticket in the footer to submit an instant
                  ticket to our dispatch desk.
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

  /*
   * Profile Panel
   *
   * Using createPortal means the profile panel is rendered
   * directly under document.body.
   *
   * Therefore it is NOT affected by:
   * overflowX: auto
   * on the navbar.
   */
  const profilePanel =
    isProfileOpen &&
      typeof document !== 'undefined'
      ? createPortal(
        <div
          ref={profileMenuRef}
          className="profile-menu-panel"
          role="menu"
          aria-label="Profile menu"
        >
          {/* ================================
                PROFILE HEADER
            ================================= */}
          <div className="profile-menu-header">
            <div className="profile-avatar-large">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle
                  cx="12"
                  cy="7"
                  r="4"
                />
              </svg>
            </div>

            <div className="profile-user-info">
              <div className="profile-user-name">
                Admin Console
              </div>

              <div className="profile-user-role">
                {role || 'SUPER_ADMIN'}
              </div>
            </div>
          </div>

          {/* ================================
                USER ID
            ================================= */}
          <div className="profile-user-id">
            <span className="profile-id-icon">
              
            </span>

            <span>
              {userId || 'admin@foodie.com'}
            </span>
          </div>

          {/* ================================
                EDIT PROFILE
            ================================= */}
          <Link
            href="/settings"
            className="profile-menu-item"
            role="menuitem"
            onClick={() => {
              setIsProfileOpen(false);
            }}
            style={{ textDecoration: 'none' }}
          >
            <span className="profile-menu-icon">
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </span>
            <span>Edit Profile</span>
          </Link>

          {/* ================================
                DIVIDER
            ================================= */}
          <div className="profile-menu-divider" />

          {/* ================================
                LOGOUT
            ================================= */}
          <button
            type="button"
            className="profile-menu-item logout-item"
            role="menuitem"
            onClick={() => {
              setIsProfileOpen(false);
              onLogout?.();
            }}
            disabled={loggingOut}
          >
            <span className="profile-menu-icon">
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line
                  x1="21"
                  y1="12"
                  x2="9"
                  y2="12"
                />
              </svg>
            </span>

            <span>
              {loggingOut
                ? 'Logging out...'
                : 'Logout'}
            </span>
          </button>
        </div>,
        document.body
      )
      : null;

  return (
    <>
      {/* =========================================================
          HEADER
      ========================================================= */}
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
        {/* =====================================================
            LEFT SIDE
        ===================================================== */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* Sidebar Collapse / Expand Menu Toggle */}
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
                border: isCompact ? '1px solid #F59E0B' : '1px solid #CBD5E1',
                backgroundColor: isCompact ? '#FEF3C7' : '#F8FAFC',
                color: isCompact ? '#D97706' : '#14532D',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              aria-label={isCompact ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isCompact ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          ) : null}

          {/* Search */}
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
            <span></span>

            <span
              style={{
                textAlign: 'left',
                whiteSpace: 'nowrap',
              }}
            >
              Search console...
            </span>

            <kbd
              className="hide-mobile-kbd"
              style={{
                fontSize: 10,
                fontWeight: 700,
                backgroundColor: '#E2E8F0',
                color: '#475569',
                padding: '2px 6px',
                borderRadius: 4,
              }}
            >
              K
            </kbd>
          </button>
        </div>

        {/* =====================================================
            NAVBAR
        ===================================================== */}
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
          {/* =================================================
              PROFILE BUTTON
          ================================================= */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              ref={profileDropdownRef}
              style={{
                position: 'relative',
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setIsProfileOpen(
                    (previous) => !previous
                  )
                }
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  border: isProfileOpen
                    ? '2px solid #10B981'
                    : '2px solid transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isProfileOpen
                    ? '0 0 0 3px rgba(16,185,129,0.15)'
                    : 'none',
                  flexShrink: 0,
                }}
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
                aria-label="User Profile Menu"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />

                  <circle
                    cx="12"
                    cy="7"
                    r="4"
                  />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* =========================================================
          PROFILE PANEL
      ========================================================= */}
      {profilePanel}

      {/* =========================================================
          SEARCH MODAL
      ========================================================= */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* =========================================================
          POLICY / INFORMATION MODAL
      ========================================================= */}
      {activeModalTab && modalDetails ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor:
              'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() =>
            setActiveModalTab(null)
          }
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
              boxShadow:
                '0 20px 40px rgba(0,0,0,0.2)',
              color: '#1E293B',
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* Modal Header */}
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'flex-start',
                marginBottom: 16,
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#14532D',
                    margin: 0,
                  }}
                >
                  {modalDetails.title}
                </h3>

                <p
                  style={{
                    fontSize: 12,
                    color: '#64748B',
                    margin:
                      '4px 0 0 0',
                  }}
                >
                  {modalDetails.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setActiveModalTab(null)
                }
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: '#64748B',
                }}
              >
                
              </button>
            </div>

            {/* Modal Body */}
            <div
              style={{
                marginBottom: 20,
              }}
            >
              {modalDetails.body}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setActiveModalTab(null)
                }
                style={{
                  padding: '8px 20px',
                  backgroundColor:
                    '#10B981',
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

      {/* =========================================================
          GLOBAL STYLES
      ========================================================= */}
      <style jsx global>{`
        /*
         * ========================================================
         * PROFILE PANEL
         * ========================================================
         *
         * IMPORTANT:
         * This panel is rendered through createPortal()
         * directly into document.body.
         *
         * Therefore it will NOT be affected by the navbar's
         * overflowX: auto.
         */

        .profile-menu-panel {
          position: fixed;

          top: 70px;
          right: 0;

          width: 310px;

          background: #ffffff;

          border: 1px solid #e2e8f0;
          border-right: none;

          border-radius: 0 0 0 16px;

          box-shadow:
            -10px 12px 35px rgba(0, 0, 0, 0.15),
            -3px 5px 15px rgba(0, 0, 0, 0.06);

          z-index: 999999;

          padding: 10px 0;

          display: flex;
          flex-direction: column;

          animation: profilePanelOpen 0.18s ease-out;
        }

        @keyframes profilePanelOpen {
          from {
            opacity: 0;
            transform: translateX(12px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /*
         * Profile Header
         */

        .profile-menu-header {
          display: flex;
          align-items: center;

          gap: 12px;

          padding: 14px 18px;

          border-bottom: 1px solid #f1f5f9;
        }

        /*
         * Avatar
         */

        .profile-avatar-large {
          width: 48px;
          height: 48px;

          min-width: 48px;

          border-radius: 50%;

          background: #ecfdf5;

          color: #10b981;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        /*
         * User Information
         */

        .profile-user-info {
          min-width: 0;
        }

        .profile-user-name {
          font-size: 16px;

          font-weight: 800;

          color: #334155;

          line-height: 1.3;
        }

        .profile-user-role {
          font-size: 12px;

          color: #64748b;

          font-weight: 600;

          margin-top: 4px;
        }

        /*
         * User ID
         */

        .profile-user-id {
          display: flex;
          align-items: center;

          gap: 6px;

          margin: 10px 16px;

          padding: 9px 10px;

          border-radius: 7px;

          background: #f8fafc;

          border: 1px solid #e2e8f0;

          font-size: 11px;

          color: #475569;

          word-break: break-all;
        }

        .profile-id-icon {
          flex-shrink: 0;
        }

        /*
         * Menu Items
         */

        .profile-menu-item {
          width: 100%;

          min-height: 48px;

          padding: 0 18px;

          display: flex;
          align-items: center;

          gap: 14px;

          background: transparent;

          border: none;

          color: #64748b;

          font-size: 14px;

          font-weight: 600;

          text-align: left;

          cursor: pointer;

          transition:
            background-color 0.15s ease,
            color 0.15s ease;
        }

        .profile-menu-item:hover {
          background-color: #f8fafc;

          color: #10b981;
        }

        /*
         * Icons
         */

        .profile-menu-icon {
          width: 24px;

          min-width: 24px;

          height: 24px;

          display: flex;

          align-items: center;

          justify-content: center;

          color: #10b981;
        }

        .profile-menu-item:hover
          .profile-menu-icon {
          color: #059669;
        }

        /*
         * Divider
         */

        .profile-menu-divider {
          height: 1px;

          background-color: #e2e8f0;

          margin: 8px 16px;
        }

        /*
         * Logout
         */

        .logout-item {
          color: #ef4444;
        }

        .logout-item
          .profile-menu-icon {
          color: #ef4444;
        }

        .logout-item:hover {
          background-color: #fef2f2;

          color: #dc2626;
        }

        .logout-item:hover
          .profile-menu-icon {
          color: #dc2626;
        }

        /*
         * Disabled Logout
         */

        .profile-menu-panel
          button:disabled {
          opacity: 0.6;

          cursor: not-allowed;
        }

        /*
         * ========================================================
         * MOBILE
         * ========================================================
         */

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

            border-top: 1px solid
              #f1f5f9;

            padding-top: 8px !important;

            margin-top: 4px;
          }

          /*
           * Profile panel stays on screen
           * even on mobile.
           */

          .profile-menu-panel {
            top: 62px;

            right: 0;

            width: 300px;

            max-width: calc(
              100vw - 8px
            );

            border-radius:
              0 0 0 14px;
          }
        }
      `}</style>
    </>
  );
}