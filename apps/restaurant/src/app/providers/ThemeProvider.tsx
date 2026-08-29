import React, { type ReactNode } from 'react';
import { ThemeProvider as SharedThemeProvider } from 'foodie-shared-rn';
import { createRestaurantTheme } from '../../theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = createRestaurantTheme('light');
  return (
    <SharedThemeProvider
      initialMode="light"
      themeOverride={() => theme}
    >
      {children}
    </SharedThemeProvider>
  );
}

