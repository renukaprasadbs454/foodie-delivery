import React, { type ReactNode } from 'react';
import { ThemeProvider as SharedThemeProvider, type ColorMode } from 'foodie-shared-rn';
import { createDeliveryTheme } from '../../theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <SharedThemeProvider
      initialMode="light"
      themeOverride={(mode: ColorMode) => createDeliveryTheme(mode)}
    >
      {children as never}
    </SharedThemeProvider>
  );
}
