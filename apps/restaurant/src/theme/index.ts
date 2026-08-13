import { createAppTheme, type ColorMode } from 'foodie-shared-rn';

/**
 * Foodie Restaurant Theme
 * Primary Color: Dark Green #14532D
 * Accent Color: Gold #F59E0B
 * Background: White / warm off-white #FDFBF7
 * Cards: White #FFFFFF with rounded corners & subtle shadows
 */
export function createRestaurantTheme(mode: ColorMode = 'light') {
  return createAppTheme(mode, {
    accent: '#14532D',
    accentMuted: '#DCFCE7',
    color: {
      background: '#FDFBF7',
      surface: '#FFFFFF',
      border: '#E2E8F0',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textInverse: '#FFFFFF',
      accent: '#14532D',
      accentMuted: '#DCFCE7',
      warning: '#F59E0B',
      success: '#16A34A',
      error: '#DC2626',
      inProgress: '#2563EB',
    },
  });
}

