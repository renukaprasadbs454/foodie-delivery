import { createAppTheme, type ColorMode } from 'foodie-shared-rn';

/**
 * Customer theme — Blueprint §19.2.
 * Thin accent extension over foodie-shared-rn tokens only.
 */
export function createCustomerTheme(mode: ColorMode = 'light') {
  return createAppTheme(mode, {
    // Provisional accent until brand tokens amended (same Module 01 gap)
  });
}
