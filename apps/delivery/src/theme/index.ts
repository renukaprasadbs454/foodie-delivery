import { createAppTheme, type ColorMode } from 'foodie-shared-rn';

/**
 * Delivery theme — Blueprint §19.2 / System Design §24.2.
 * Thin accent extension over foodie-shared-rn tokens only.
 */
export function createDeliveryTheme(mode: ColorMode = 'light') {
  return createAppTheme(mode, {
    // Theme Option 3: Dark Green + Gold
    accent: '#14532D', // Dark Green
    accentMuted: 'rgba(245, 158, 11, 0.15)', // Light Gold/Muted
    color: {
      background: '#FAFAFA',
      surface: '#FFFFFF',
      textPrimary: '#14532D', // Makes headers Dark Green
      warning: '#F59E0B', // Gold for stars/ratings
      success: '#14532D',
      inProgress: '#F59E0B',
    },
  });
}
