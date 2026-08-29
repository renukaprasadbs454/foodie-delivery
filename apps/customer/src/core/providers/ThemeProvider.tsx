import React, { type ReactNode } from 'react';
import { ThemeProvider as SharedThemeProvider } from 'foodie-shared-rn';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <SharedThemeProvider
      initialMode="light"
      accentOverrides={{
        accent: '#14532D', // Primary Dark Green
        accentMuted: '#F59E0B', // Primary Gold
        color: {
          background: '#FDFBF7', // Warm Beige Base
          surface: '#FFFFFF',    // White for clean contrast on cards
          border: '#E6DFD3',     // Warm neutral borders
          textPrimary: '#1F2937', // Charcoal for better contrast on beige
          textSecondary: '#4B5563',
        },
      }}
    >
      {children}
    </SharedThemeProvider>
  );
}

