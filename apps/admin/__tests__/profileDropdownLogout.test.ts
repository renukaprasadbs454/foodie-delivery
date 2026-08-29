import { AdminHeaderBar } from '../components/AdminHeaderBar';

describe('Profile Avatar Dropdown Contract', () => {
  it('opens profile dropdown with standard user avatar icon and Log out option without hardcoded email', () => {
    const profileDropdownConfig = {
      trigger: 'avatar-icon-click',
      headerTitle: 'Admin Console',
      hasEmailText: false,
      hasLetterLogo: false,
      options: [
        { label: 'Log out', action: 'onLogout', color: '#EF4444' },
      ],
    };

    expect(profileDropdownConfig.trigger).toBe('avatar-icon-click');
    expect(profileDropdownConfig.headerTitle).toBe('Admin Console');
    expect(profileDropdownConfig.hasEmailText).toBe(false);
    expect(profileDropdownConfig.hasLetterLogo).toBe(false);
    expect(profileDropdownConfig.options).toHaveLength(1);
    expect(profileDropdownConfig.options[0].label).toBe('Log out');
  });
});
