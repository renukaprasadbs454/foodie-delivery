import {
  canAccessAnalyticsSummary,
  canAccessAuditLog,
  canAccessOrderStatusMetrics,
  canApproveDeliveryKyc,
  canManageCoupons,
  canManageRestaurants,
  canOverrideOrderStatus,
  canRefundPayment,
  filterNavForRole,
  shouldAllowDashboard,
} from '../lib/routeGuards';

describe('routeGuards', () => {
  it('allows dashboard only when authenticated', () => {
    expect(shouldAllowDashboard('authenticated')).toBe(true);
    expect(shouldAllowDashboard('unauthenticated')).toBe(false);
    expect(shouldAllowDashboard('idle')).toBe(false);
  });

  it('restricts audit log to SUPER_ADMIN', () => {
    expect(canAccessAuditLog('SUPER_ADMIN')).toBe(true);
    expect(canAccessAuditLog('OPS')).toBe(false);
    expect(canAccessAuditLog(null)).toBe(false);
  });

  it('gates analytics summary and order-status by role', () => {
    expect(canAccessAnalyticsSummary('OPS')).toBe(true);
    expect(canAccessAnalyticsSummary('FINANCE')).toBe(true);
    expect(canAccessAnalyticsSummary('SUPER_ADMIN')).toBe(true);
    expect(canAccessAnalyticsSummary('SUPPORT')).toBe(false);
    expect(canAccessAnalyticsSummary(null)).toBe(false);

    expect(canAccessOrderStatusMetrics('OPS')).toBe(true);
    expect(canAccessOrderStatusMetrics('SUPER_ADMIN')).toBe(true);
    expect(canAccessOrderStatusMetrics('FINANCE')).toBe(false);
    expect(canAccessOrderStatusMetrics('SUPPORT')).toBe(false);
  });

  it('gates restaurant manage and delivery KYC to OPS / SUPER_ADMIN', () => {
    expect(canManageRestaurants('OPS')).toBe(true);
    expect(canManageRestaurants('SUPER_ADMIN')).toBe(true);
    expect(canManageRestaurants('FINANCE')).toBe(false);
    expect(canManageRestaurants('SUPPORT')).toBe(false);
    expect(canApproveDeliveryKyc('OPS')).toBe(true);
    expect(canApproveDeliveryKyc('FINANCE')).toBe(false);
  });

  it('gates order override and payment refund by role', () => {
    expect(canOverrideOrderStatus('OPS')).toBe(true);
    expect(canOverrideOrderStatus('FINANCE')).toBe(false);
    expect(canRefundPayment('FINANCE')).toBe(true);
    expect(canRefundPayment('OPS')).toBe(true);
    expect(canRefundPayment('SUPPORT')).toBe(false);
  });

  it('shows payments nav for FINANCE/OPS/SUPER_ADMIN only', () => {
    expect(filterNavForRole('FINANCE').map((i) => i.href)).toContain('/payments');
    expect(filterNavForRole('SUPPORT').map((i) => i.href)).not.toContain(
      '/payments',
    );
    expect(filterNavForRole(null).map((i) => i.href)).not.toContain('/payments');
  });

  it('gates coupons manage and coupons nav', () => {
    expect(canManageCoupons('OPS')).toBe(true);
    expect(canManageCoupons('FINANCE')).toBe(true);
    expect(canManageCoupons('SUPPORT')).toBe(false);
    expect(filterNavForRole('SUPPORT').map((i) => i.href)).not.toContain(
      '/coupons',
    );
    expect(filterNavForRole('OPS').map((i) => i.href)).toContain('/coupons');
    expect(filterNavForRole('OPS').map((i) => i.href)).toContain('/reviews');
  });

  it('includes Dashboard nav and hides audit log without SUPER_ADMIN', () => {
    const withoutRole = filterNavForRole(null).map((i) => i.href);
    expect(withoutRole).toContain('/');
    expect(withoutRole).toContain('/analytics');
    expect(withoutRole).toContain('/reviews');
    expect(withoutRole).not.toContain('/audit-log');
    expect(withoutRole).not.toContain('/coupons');

    const ops = filterNavForRole('OPS').map((i) => i.href);
    expect(ops).toContain('/');
    expect(ops).not.toContain('/audit-log');

    const superAdmin = filterNavForRole('SUPER_ADMIN').map((i) => i.href);
    expect(superAdmin).toContain('/audit-log');
  });
});

