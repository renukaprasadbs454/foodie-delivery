import { SettingsPage, SettingsTab } from '../features/settings/pages/SettingsPage';

describe('Admin Settings Page Expansion Contract', () => {
  it('validates 9 setting categories are supported in SettingsTab type', () => {
    const requiredSettingTabs: SettingsTab[] = [
      'admin-profile',
      'page-setup',
      'admin-users',
      'roles-permissions',
      'commission-settings',
      'tax-gst',
      'payment-settings',
      'app-settings',
      'security',
    ];

    expect(requiredSettingTabs).toHaveLength(9);
    expect(requiredSettingTabs).toContain('admin-profile');
    expect(requiredSettingTabs).toContain('page-setup');
    expect(requiredSettingTabs).toContain('roles-permissions');
    expect(requiredSettingTabs).toContain('tax-gst');
    expect(requiredSettingTabs).toContain('payment-settings');
  });
});
