import type { AdminRole, AuthStatus } from 'foodie-shared-web';

/**
 * Structural auth / role helpers — Blueprint §15.2.
 * Middleware enforces server-side; these support client nav filtering.
 */
export function shouldAllowDashboard(authStatus: AuthStatus): boolean {
  return authStatus === 'authenticated';
}

export function canAccessAuditLog(role: AdminRole | null): boolean {
  return role === 'SUPER_ADMIN';
}

/** Dashboard summary + daily-sales — OPS / FINANCE / SUPER_ADMIN (not SUPPORT). */
export function canAccessAnalyticsSummary(role: AdminRole | null): boolean {
  return role === 'OPS' || role === 'FINANCE' || role === 'SUPER_ADMIN';
}

/** Order-status metrics — OPS / SUPER_ADMIN only. */
export function canAccessOrderStatusMetrics(role: AdminRole | null): boolean {
  return role === 'OPS' || role === 'SUPER_ADMIN';
}

/** Restaurant approve/suspend + delivery KYC — OPS / SUPER_ADMIN. */
export function canManageRestaurants(role: AdminRole | null): boolean {
  return role === 'OPS' || role === 'SUPER_ADMIN';
}

export function canApproveDeliveryKyc(role: AdminRole | null): boolean {
  return role === 'OPS' || role === 'SUPER_ADMIN';
}

/** Order status override — OPS / SUPER_ADMIN. */
export function canOverrideOrderStatus(role: AdminRole | null): boolean {
  return role === 'OPS' || role === 'SUPER_ADMIN';
}

/** Payment refund — FINANCE / OPS / SUPER_ADMIN. */
export function canRefundPayment(role: AdminRole | null): boolean {
  return role === 'FINANCE' || role === 'OPS' || role === 'SUPER_ADMIN';
}

/** Coupon create/deactivate — OPS / FINANCE / SUPER_ADMIN. */
export function canManageCoupons(role: AdminRole | null): boolean {
  return role === 'OPS' || role === 'FINANCE' || role === 'SUPER_ADMIN';
}

export type NavItem = {
  href: string;
  label: string;
  /** When set, only these roles see the link. */
  roles?: readonly AdminRole[];
};

/** Role-aware sidebar inventory — System Design §5.3 / P2-ADM-02…05. */
export const DASHBOARD_NAV: readonly NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/restaurants', label: 'Restaurants' },
  { href: '/delivery-partners', label: 'Delivery Partners' },
  {
    href: '/coupons',
    label: 'Coupons',
    roles: ['OPS', 'FINANCE', 'SUPER_ADMIN'],
  },
  { href: '/orders', label: 'Orders' },
  {
    href: '/payments',
    label: 'Payments',
    roles: ['FINANCE', 'OPS', 'SUPER_ADMIN'],
  },
  { href: '/reviews', label: 'Reviews' },
  { href: '/analytics', label: 'Analytics' },
  {
    href: '/audit-log',
    label: 'Audit Log',
    roles: ['SUPER_ADMIN'],
  },
] as const;

export function filterNavForRole(role: AdminRole | null): NavItem[] {
  return DASHBOARD_NAV.filter((item) => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.includes(role);
  });
}
