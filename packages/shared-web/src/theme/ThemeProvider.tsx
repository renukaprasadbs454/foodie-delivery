import React, {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { tokensToCssVariables } from './cssVariables';
import {
  createAppTheme,
  type ColorMode,
  type DesignTokens,
  type SemanticColorTokens,
} from './tokens';

export type ThemeContextValue = {
  mode: ColorMode;
  tokens: DesignTokens;
  cssVariables: Record<string, string>;
  setMode: (mode: ColorMode) => void;
  toggleMode: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export type ThemeProviderProps = {
  children: ReactNode;
  initialMode?: ColorMode;
  accentOverrides?: {
    accent?: string;
    accentMuted?: string;
    color?: Partial<SemanticColorTokens>;
  };
  themeOverride?: (mode: ColorMode, base: DesignTokens) => DesignTokens;
  /** When true, applies CSS variables onto documentElement (Admin default). */
  applyToDocument?: boolean;
};

/**
 * Theme via React Context — Blueprint §19.3.
 * Also exposes CSS variables for Tailwind consumption (System Design §24.1).
 */
export function ThemeProvider({
  children,
  initialMode = 'light',
  accentOverrides,
  themeOverride,
  applyToDocument = true,
}: ThemeProviderProps) {
  const [mode, setMode] = useState<ColorMode>(initialMode);

  const value = useMemo<ThemeContextValue>(() => {
    const base = createAppTheme(mode, accentOverrides);
    const tokens = themeOverride ? themeOverride(mode, base) : base;
    return {
      mode,
      tokens,
      cssVariables: tokensToCssVariables(tokens),
      setMode,
      toggleMode: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
    };
  }, [mode, accentOverrides, themeOverride]);

  useEffect(() => {
    if (!applyToDocument || typeof document === 'undefined') return;
    const root = document.documentElement;
    root.setAttribute('data-theme', value.mode);
    for (const [key, cssValue] of Object.entries(value.cssVariables)) {
      root.style.setProperty(key, cssValue);
    }
  }, [applyToDocument, value.cssVariables, value.mode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
