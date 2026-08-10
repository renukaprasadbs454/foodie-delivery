import { DASHBOARD_NAV, filterNavForRole } from '../lib/routeGuards';

describe('6amMart Admin Panel Navigation & Role Configuration', () => {
  it('categorizes navigation items according to 6amMart multi-vendor structure', () => {
    const mainItems = DASHBOARD_NAV.filter(item => item.category === 'MAIN');
    const businessItems = DASHBOARD_NAV.filter(item => item.category === 'BUSINESS MANAGERS');
    const orderItems = DASHBOARD_NAV.filter(item => item.category === 'ORDER HUB');
    const financeItems = DASHBOARD_NAV.filter(item => item.category === 'FINANCE & MARKETING');
    const systemItems = DASHBOARD_NAV.filter(item => item.category === 'SYSTEM');

    expect(mainItems.map(i => i.href)).toEqual(['/', '/analytics']);
    expect(businessItems.map(i => i.href)).toEqual(['/restaurants', '/delivery-partners']);
    expect(orderItems.map(i => i.href)).toEqual(['/orders']);
    expect(financeItems.map(i => i.href)).toEqual(['/coupons', '/payments']);
    expect(systemItems.map(i => i.href)).toEqual(['/reviews', '/audit-log']);
  });

  it('includes icons and badges on 6amMart navigation items', () => {
    const orderNav = DASHBOARD_NAV.find(i => i.href === '/orders');
    expect(orderNav?.icon).toBe('📦');
    expect(orderNav?.badge).toBe('LIVE');

    const restaurantNav = DASHBOARD_NAV.find(i => i.href === '/restaurants');
    expect(restaurantNav?.icon).toBe('🍽️');
  });

  it('correctly filters categorized navigation for different roles', () => {
    const superAdminNav = filterNavForRole('SUPER_ADMIN');
    expect(superAdminNav.length).toBe(9);

    const supportNav = filterNavForRole('SUPPORT');
    expect(supportNav.map(i => i.href)).toEqual([
      '/',
      '/analytics',
      '/restaurants',
      '/delivery-partners',
      '/orders',
      '/reviews',
    ]);
  });
});
