import type { AdminRole, AuthStatus } from 'foodie-shared-web';

/**
 * Structural auth & granular RBAC route helpers.
 */
export function shouldAllowDashboard(authStatus: AuthStatus): boolean {
  return authStatus === 'authenticated';
}

export function canAccessAuditLog(role: AdminRole | string | null): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'SUPER_ADMIN' || r === 'AUDITOR' || r === 'FINANCE_ADMIN' || r === 'FINANCE';
}

export function canAccessAnalyticsSummary(role: AdminRole | string | null): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'OPS' || r === 'FINANCE' || r === 'SUPER_ADMIN' || r === 'FINANCE_ADMIN' || r === 'OPERATIONS_ADMIN';
}

export function canAccessOrderStatusMetrics(role: AdminRole | string | null): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'OPS' || r === 'OPERATIONS_ADMIN' || r === 'SUPER_ADMIN';
}

export function canManageRestaurants(role: AdminRole | string | null): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'OPS' || r === 'OPERATIONS_ADMIN' || r === 'SUPER_ADMIN' || r === 'RESTAURANT_MANAGER';
}

export function canApproveDeliveryKyc(role: AdminRole | string | null): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'OPS' || r === 'OPERATIONS_ADMIN' || r === 'SUPER_ADMIN';
}

export function canOverrideOrderStatus(role: AdminRole | string | null): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'OPS' || r === 'OPERATIONS_ADMIN' || r === 'SUPER_ADMIN';
}

export function canRefundPayment(role: AdminRole | string | null): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'FINANCE' || r === 'FINANCE_ADMIN' || r === 'OPS' || r === 'OPERATIONS_ADMIN' || r === 'SUPER_ADMIN';
}

export function canManageCoupons(role: AdminRole | string | null): boolean {
  if (!role) return false;
  const r = role.toUpperCase();
  return r === 'OPS' || r === 'OPERATIONS_ADMIN' || r === 'FINANCE' || r === 'FINANCE_ADMIN' || r === 'SUPER_ADMIN';
}

export function getHomeRouteForRole(role: string | null): string {
  if (!role) return '/dashboard';
  const r = role.toUpperCase();
  if (r.includes('DARKSTORE')) return '/darkstore-admin/dashboard';
  if (r.includes('FINANCE')) return '/finance-admin/dashboard';
  if (r.includes('RESTAURANT')) return '/restaurant-admin/dashboard';
  if (r.includes('SUPPORT')) return '/support-admin/dashboard';
  if (r.includes('AUDITOR')) return '/audit-log';
  return '/dashboard';
}

export function isRouteAllowedForRole(pathname: string, role: string | null): boolean {
  if (!role) return false;
  const r = role.toUpperCase();

  // Super Admin can access all routes
  if (r === 'SUPER_ADMIN') return true;

  // Darkstore Admin strictly isolated to darkstore module
  if (r.includes('DARKSTORE')) {
    return pathname.startsWith('/darkstore-admin') || pathname === '/login';
  }

  // Finance Admin access
  if (r.includes('FINANCE')) {
    if (pathname.startsWith('/users') || pathname.startsWith('/roles') || pathname.startsWith('/darkstore-admin') || pathname.startsWith('/restaurant-admin')) {
      return false;
    }
    return (
      pathname.startsWith('/finance-admin') ||
      pathname.startsWith('/payments') ||
      pathname.startsWith('/delivery-payouts') ||
      pathname.startsWith('/approvals') ||
      pathname.startsWith('/coupons') ||
      pathname.startsWith('/analytics') ||
      pathname === '/' ||
      pathname === '/dashboard' ||
      pathname === '/login'
    );
  }

  // Restaurant Admin access
  if (r.includes('RESTAURANT')) {
    if (pathname.startsWith('/users') || pathname.startsWith('/roles') || pathname.startsWith('/darkstore-admin') || pathname.startsWith('/approvals') || pathname.startsWith('/delivery-payouts')) {
      return false;
    }
    return (
      pathname.startsWith('/restaurant-admin') ||
      pathname.startsWith('/restaurants') ||
      pathname.startsWith('/orders') ||
      pathname.startsWith('/reviews') ||
      pathname === '/' ||
      pathname === '/dashboard' ||
      pathname === '/login'
    );
  }

  // Support Agent access
  if (r.includes('SUPPORT')) {
    if (pathname.startsWith('/users') || pathname.startsWith('/roles') || pathname.startsWith('/darkstore-admin') || pathname.startsWith('/approvals') || pathname.startsWith('/delivery-payouts') || pathname.startsWith('/audit-log')) {
      return false;
    }
    return (
      pathname.startsWith('/support-admin') ||
      pathname.startsWith('/orders') ||
      pathname.startsWith('/reviews') ||
      pathname.startsWith('/customers') ||
      pathname === '/' ||
      pathname === '/dashboard' ||
      pathname === '/login'
    );
  }

  // Compliance Auditor access
  if (r.includes('AUDITOR')) {
    if (pathname.startsWith('/users') || pathname.startsWith('/roles') || pathname.startsWith('/darkstore-admin') || pathname.startsWith('/approvals')) {
      return false;
    }
    return true;
  }

  // Operations Admin default
  if (pathname.startsWith('/users') || pathname.startsWith('/roles') || pathname.startsWith('/darkstore-admin')) {
    return false;
  }

  return true;
}

export type NavCategory = 'MAIN' | 'BUSINESS MANAGERS' | 'ORDER HUB' | 'FINANCE & MARKETING' | 'SYSTEM';

export type NavItem = {
  href: string;
  label: string;
  category?: NavCategory;
  icon?: string;
  badge?: string;
  highlighted?: boolean;
  roles?: readonly string[];
  permission?: string;
};

export const DASHBOARD_NAV: readonly NavItem[] = [
  { href: '/', label: 'Home', category: 'MAIN', highlighted: true },
  { href: '/dashboard', label: 'Dashboard', category: 'MAIN' },
  { href: '/analytics', label: 'Analytics', category: 'MAIN' },
  { href: '/members', label: 'Members', category: 'BUSINESS MANAGERS', highlighted: true, roles: ['SUPER_ADMIN', 'OPS', 'OPERATIONS_ADMIN'] },
  { href: '/users', label: 'Users', category: 'BUSINESS MANAGERS', icon: '', roles: ['SUPER_ADMIN', 'OPS', 'OPERATIONS_ADMIN', 'FINANCE', 'FINANCE_ADMIN', 'SUPPORT', 'SUPPORT_AGENT'] },
  { href: '/customers', label: 'Customers', category: 'BUSINESS MANAGERS', roles: ['SUPER_ADMIN', 'OPS', 'OPERATIONS_ADMIN', 'SUPPORT', 'SUPPORT_AGENT'] },
  { href: '/restaurants', label: 'Restaurants', category: 'BUSINESS MANAGERS', icon: '', roles: ['SUPER_ADMIN', 'OPS', 'OPERATIONS_ADMIN', 'RESTAURANT_MANAGER'] },
  { href: '/delivery-partners', label: 'Delivery Partners', category: 'BUSINESS MANAGERS', roles: ['SUPER_ADMIN', 'OPS', 'OPERATIONS_ADMIN'] },
  { href: '/other', label: 'Others', category: 'BUSINESS MANAGERS', highlighted: true, roles: ['SUPER_ADMIN', 'OPS', 'OPERATIONS_ADMIN'] },
  { href: '/location', label: 'Location Management', category: 'BUSINESS MANAGERS', roles: ['SUPER_ADMIN', 'OPS', 'OPERATIONS_ADMIN'] },
  { href: '/social-media', label: 'Social Media', category: 'BUSINESS MANAGERS', icon: '', roles: ['SUPER_ADMIN', 'OPS', 'OPERATIONS_ADMIN', 'SUPPORT', 'SUPPORT_AGENT'] },
  { href: '/orders', label: 'Orders', category: 'ORDER HUB', icon: '', badge: 'LIVE', permission: 'order.view', roles: ['SUPER_ADMIN', 'OPS', 'OPERATIONS_ADMIN', 'SUPPORT', 'SUPPORT_AGENT', 'RESTAURANT_MANAGER', 'AUDITOR'] },
  {
    href: '/coupons',
    label: 'Coupons',
    category: 'FINANCE & MARKETING',
    permission: 'commission.view',
    roles: ['FINANCE_ADMIN', 'OPERATIONS_ADMIN', 'SUPER_ADMIN', 'OPS', 'FINANCE'],
  },
  {
    href: '/payments',
    label: 'Payments',
    category: 'FINANCE & MARKETING',
    permission: 'payment.view',
    roles: ['FINANCE_ADMIN', 'OPERATIONS_ADMIN', 'SUPER_ADMIN', 'FINANCE', 'OPS'],
  },
  { href: '/reviews', label: 'Reviews & Complaints', category: 'SYSTEM' },
  {
    href: '/audit-log',
    label: 'Audit Log',
    category: 'SYSTEM',
    permission: 'audit_log.view',
    roles: ['SUPER_ADMIN', 'FINANCE_ADMIN', 'FINANCE', 'AUDITOR'],
  },
  { href: '/settings', label: 'Settings', category: 'SYSTEM', icon: '' },
] as const;

export function filterNavForRole(role: string | null): NavItem[] {
  return DASHBOARD_NAV.filter((item) => {
    if (!item.roles) return true;
    if (!role) return false;
    return item.roles.some((r) => r.toLowerCase() === role.toLowerCase());
  });
}
