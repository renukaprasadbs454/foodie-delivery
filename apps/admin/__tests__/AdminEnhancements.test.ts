import { DASHBOARD_NAV, filterNavForRole } from '../lib/routeGuards';

describe('6amMart Admin Panel Navigation & Role Configuration', () => {
  it('categorizes navigation items according to 6amMart multi-vendor structure', () => {
    const mainItems = DASHBOARD_NAV.filter(item => item.category === 'MAIN');
    const businessItems = DASHBOARD_NAV.filter(item => item.category === 'BUSINESS MANAGERS');
    const orderItems = DASHBOARD_NAV.filter(item => item.category === 'ORDER HUB');
    const financeItems = DASHBOARD_NAV.filter(item => item.category === 'FINANCE & MARKETING');
    const systemItems = DASHBOARD_NAV.filter(item => item.category === 'SYSTEM');

    expect(mainItems.map(i => i.href)).toEqual(['/', '/dashboard', '/analytics']);
    expect(businessItems.map(i => i.href)).toEqual(['/members', '/users', '/customers', '/restaurants', '/delivery-partners', '/other', '/location', '/social-media']);
    expect(orderItems.map(i => i.href)).toEqual(['/orders']);
    expect(financeItems.map(i => i.href)).toEqual(['/coupons', '/payments']);
    expect(systemItems.map(i => i.href)).toEqual(['/approvals', '/reviews', '/audit-log', '/settings']);
  });

  it('includes icons and badges on 6amMart navigation items', () => {
    const homeNav = DASHBOARD_NAV.find(i => i.href === '/');
    expect(homeNav?.icon).toBeUndefined();
    expect(homeNav?.highlighted).toBe(true);

    const membersNav = DASHBOARD_NAV.find(i => i.href === '/members');
    expect(membersNav?.icon).toBeUndefined();
    expect(membersNav?.highlighted).toBe(true);

    const usersNav = DASHBOARD_NAV.find(i => i.href === '/users');
    expect(usersNav?.icon).toBe('');

    const socialMediaNav = DASHBOARD_NAV.find(i => i.href === '/social-media');
    expect(socialMediaNav?.icon).toBe('');

    const otherNav = DASHBOARD_NAV.find(i => i.href === '/other');
    expect(otherNav?.icon).toBeUndefined();
    expect(otherNav?.highlighted).toBe(true);

    const orderNav = DASHBOARD_NAV.find(i => i.href === '/orders');
    expect(orderNav?.icon).toBe('');
    expect(orderNav?.badge).toBe('LIVE');

    const restaurantNav = DASHBOARD_NAV.find(i => i.href === '/restaurants');
    expect(restaurantNav?.icon).toBe('');

    const settingsNav = DASHBOARD_NAV.find(i => i.href === '/settings');
    expect(settingsNav?.icon).toBe('');
  });

  it('correctly filters categorized navigation for different roles', () => {
    const superAdminNav = filterNavForRole('SUPER_ADMIN');
    expect(superAdminNav.length).toBe(18);

    const supportNav = filterNavForRole('SUPPORT');
    expect(supportNav.map(i => i.href)).toEqual([
      '/',
      '/dashboard',
      '/analytics',
      '/users',
      '/customers',
      '/social-media',
      '/orders',
      '/reviews',
      '/settings',
    ]);
  });
});
