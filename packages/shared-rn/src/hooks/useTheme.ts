import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '../theme/ThemeProvider';

/** Blueprint §19.3 — consume merged tokens from ThemeProvider. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
