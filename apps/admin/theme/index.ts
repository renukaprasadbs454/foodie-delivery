import { createAppTheme, type ColorMode } from 'foodie-shared-web';

/**
 * Admin theme — Blueprint §19.2.
 * Thin accent extension over foodie-shared-web tokens only.
 */
export function createAdminTheme(mode: ColorMode = 'light') {
  return createAppTheme(mode, {
    // Provisional accent until brand tokens amended (Module 01/02 gap)
  });
}
