import React, { type ReactNode } from 'react';
import { ThemeProvider as SharedThemeProvider } from 'foodie-shared-rn';

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <SharedThemeProvider initialMode="light">
      {children as never}
    </SharedThemeProvider>
  );
}
