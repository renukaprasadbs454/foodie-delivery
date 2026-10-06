import { createAppTheme } from './shared-theme';
import type { ColorMode } from './tokens';

/**
 * Delivery theme
 */
export function createDeliveryTheme(mode: ColorMode = 'light') {
  return createAppTheme(mode, {
  });
}
