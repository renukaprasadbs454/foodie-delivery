import { DASHBOARD_NAV, filterNavForRole } from '../lib/routeGuards';
import { formatRoleBadge, formatStatusBadge } from '../features/users/types/usersTypes';

describe('Users Feature & Sidebar Integration', () => {
  it('places /users in DASHBOARD_NAV under Members in BUSINESS MANAGERS category', () => {
    const businessItems = DASHBOARD_NAV.filter((item) => item.category === 'BUSINESS MANAGERS');
    const hrefs = businessItems.map((item) => item.href);

    expect(hrefs).toContain('/users');
    const membersIdx = hrefs.indexOf('/members');
    const usersIdx = hrefs.indexOf('/users');
    expect(usersIdx).toBe(membersIdx + 1);

    const usersNavItem = DASHBOARD_NAV.find((item) => item.href === '/users');
    expect(usersNavItem).toBeDefined();
    expect(usersNavItem?.label).toBe('Users');
    expect(usersNavItem?.icon).toBe('');
    expect(usersNavItem?.category).toBe('BUSINESS MANAGERS');
  });

  it('includes /users for all admin roles in filterNavForRole', () => {
    expect(filterNavForRole('SUPER_ADMIN').map((i) => i.href)).toContain('/users');
    expect(filterNavForRole('OPS').map((i) => i.href)).toContain('/users');
    expect(filterNavForRole('FINANCE').map((i) => i.href)).toContain('/users');
    expect(filterNavForRole('SUPPORT').map((i) => i.href)).toContain('/users');
  });

  it('formats role badges correctly for administrative roles', () => {
    const superAdmin = formatRoleBadge('SUPER_ADMIN');
    expect(superAdmin.label).toBe('SUPER ADMIN');
    expect(superAdmin.color).toBe('#7C3AED');

    const ops = formatRoleBadge('OPS');
    expect(ops.label).toBe('OPERATIONS');
    expect(ops.color).toBe('#047857');

    const finance = formatRoleBadge('FINANCE');
    expect(finance.label).toBe('FINANCE');
    expect(finance.color).toBe('#B45309');

    const support = formatRoleBadge('SUPPORT');
    expect(support.label).toBe('SUPPORT DESK');
    expect(support.color).toBe('#1D4ED8');
  });

  it('formats account status badges correctly', () => {
    const active = formatStatusBadge('ACTIVE');
    expect(active.label).toBe('● Active');
    expect(active.color).toBe('#166534');

    const suspended = formatStatusBadge('SUSPENDED');
    expect(suspended.label).toBe('○ Suspended');
    expect(suspended.color).toBe('#DC2626');
  });
});
