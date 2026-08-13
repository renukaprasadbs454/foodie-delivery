import { filterNavForRole } from '../lib/routeGuards';
import { calculateCustomerLtvBadge } from '../features/customers/types/customerTypes';

describe('Customer Operations & Support Studio Integration Tests', () => {
  test('filterNavForRole exposes Customers link for all admin roles', () => {
    const superAdminNav = filterNavForRole('SUPER_ADMIN');
    const opsNav = filterNavForRole('OPS');
    const supportNav = filterNavForRole('SUPPORT');

    expect(superAdminNav.some((item) => item.href === '/customers')).toBe(true);
    expect(opsNav.some((item) => item.href === '/customers')).toBe(true);
    expect(supportNav.some((item) => item.href === '/customers')).toBe(true);
  });

  test('calculateCustomerLtvBadge assigns correct tier badges and colors', () => {
    expect(calculateCustomerLtvBadge(1280).tier).toBe('PLATINUM VIP');
    expect(calculateCustomerLtvBadge(620).tier).toBe('GOLD');
    expect(calculateCustomerLtvBadge(240).tier).toBe('SILVER');
    expect(calculateCustomerLtvBadge(85).tier).toBe('BRONZE');
  });
});
