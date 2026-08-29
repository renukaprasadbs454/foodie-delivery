import { createAppTheme, type ColorMode } from 'foodie-shared-rn';

/**
 * Customer theme — Blueprint §19.2.
 * Thin accent extension over foodie-shared-rn tokens only.
 */
export function createCustomerTheme(mode: ColorMode = 'light') {
  return createAppTheme(mode, {
    accent: '#14532D', // Primary Brand Dark Green
    accentMuted: '#F59E0B', // Secondary Accent Gold
    color: {
      background: '#FDFBF7', // Premium soft beige
      surface: '#FFFFFF', // High contrast clean cards
      textPrimary: '#14532D', // Distinctive dark green text
      textSecondary: '#6B7280', // Soft readable subtext
      inProgress: '#F59E0B',
      warning: '#F59E0B',
      border: '#EAE6DF', // Soft warm borders
    }
  });
}
