import React, { createContext, useMemo, useState, type ReactNode } from 'react';
import {
  createAppTheme,
  type ColorMode,
  type DesignTokens,
  type SemanticColorTokens,
} from './tokens';

export type ThemeContextValue = {
  mode: ColorMode;
  tokens: DesignTokens;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
};

const defaultThemeTokens = createAppTheme('light', {
  accent: '#14532D',
  accentMuted: '#F59E0B',
});

const defaultThemeContextValue: ThemeContextValue = {
  mode: 'light',
  tokens: defaultThemeTokens,
  setMode: () => { },
  toggleMode: () => { },
};

export const ThemeContext = createContext<ThemeContextValue>(defaultThemeContextValue);

export type ThemeProviderProps = {
  children?: any;
  initialMode?: ColorMode;
  /**
   * App-specific accent / color overrides (Blueprint §19.2).
   */
  accentOverrides?: {
    accent?: string;
    accentMuted?: string;
    color?: Partial<SemanticColorTokens>;
  };
  /**
   * Fully resolved theme override (rare). Prefer accentOverrides.
   */
  themeOverride?: (mode: ColorMode, base: DesignTokens) => DesignTokens;
};

/**
 * Theme is presentation configuration via React Context — not Redux (Blueprint §19.3).
 */
export function ThemeProvider({
  children,
  initialMode = 'light',
  accentOverrides,
  themeOverride,
}: ThemeProviderProps) {
  const [mode, setMode] = useState<ColorMode>(initialMode);

  const value = useMemo<ThemeContextValue>(() => {
    const base = createAppTheme(mode, accentOverrides);
    const tokens = themeOverride ? themeOverride(mode, base) : base;
    return {
      mode,
      tokens,
      setMode,
      toggleMode: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
    };
  }, [mode, accentOverrides, themeOverride]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
