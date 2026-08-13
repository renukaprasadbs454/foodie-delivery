import { createAppTheme, type ColorMode } from 'foodie-shared-web';

/**
 * Admin theme — Blueprint §19.2.
 * Thin accent extension over foodie-shared-web tokens only.
 */
export function createAdminTheme(mode: ColorMode = 'light') {
  return createAppTheme(mode, {
    accent: '#14532D',
    accentMuted: '#E6F4EA',
    color: {
      warning: '#F59E0B',
      inProgress: '#14532D',
    },
  });
}

