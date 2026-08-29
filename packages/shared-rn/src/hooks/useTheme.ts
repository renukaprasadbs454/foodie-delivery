import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '../theme/ThemeProvider';
import { createAppTheme } from '../theme/tokens';

const defaultTheme = createAppTheme('light', {
  accent: '#14532D',
  accentMuted: '#F59E0B',
});

const defaultContextValue: ThemeContextValue = {
  mode: 'light',
  tokens: defaultTheme,
  setMode: () => { },
  toggleMode: () => { },
};

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  return ctx ?? defaultContextValue;
}
