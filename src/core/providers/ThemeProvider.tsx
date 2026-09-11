import React, { type ReactNode } from 'react';
import { ThemeProvider as SharedThemeProvider } from '@/theme/ThemeProvider';
import { type ColorMode } from '@/theme/tokens';
import { createDeliveryTheme } from '@/theme/deliveryTheme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <SharedThemeProvider
      initialMode="light"
      themeOverride={(mode: ColorMode) => createDeliveryTheme(mode)}
    >
      {children}
    </SharedThemeProvider>
  );
}
