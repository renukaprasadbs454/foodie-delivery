import { createAppTheme, type ColorMode } from 'foodie-shared-rn';

/**
 * Restaurant theme — Blueprint §19.2 / System Design §24.2.
 * Thin accent extension over foodie-shared-rn tokens only.
 */
export function createRestaurantTheme(mode: ColorMode = 'light') {
  return createAppTheme(mode, {
    // Provisional accent until brand tokens amended (same Module 01 gap)
  });
}
