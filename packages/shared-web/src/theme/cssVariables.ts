import type { ColorMode, DesignTokens } from './tokens';

/**
 * Transform design tokens into CSS custom properties for Tailwind / Admin.
 * System Design §24.1 — Admin consumes CSS-variable equivalents of shared tokens.
 */
export function tokensToCssVariables(tokens: DesignTokens): Record<string, string> {
  return {
    '--color-background': tokens.color.background,
    '--color-surface': tokens.color.surface,
    '--color-text-primary': tokens.color.textPrimary,
    '--color-text-secondary': tokens.color.textSecondary,
    '--color-text-inverse': tokens.color.textInverse,
    '--color-accent': tokens.color.accent,
    '--color-accent-muted': tokens.color.accentMuted,
    '--color-error': tokens.color.error,
    '--color-success': tokens.color.success,
    '--color-warning': tokens.color.warning,
    '--color-in-progress': tokens.color.inProgress,
    '--color-border': tokens.color.border,
    '--color-overlay': tokens.color.overlay,
    '--color-disabled': tokens.color.disabled,
    '--space-xs': `${tokens.spacing.xs}px`,
    '--space-sm': `${tokens.spacing.sm}px`,
    '--space-md': `${tokens.spacing.md}px`,
    '--space-lg': `${tokens.spacing.lg}px`,
    '--space-xl': `${tokens.spacing.xl}px`,
    '--space-xxl': `${tokens.spacing.xxl}px`,
    '--radius-sm': `${tokens.radius.sm}px`,
    '--radius-md': `${tokens.radius.md}px`,
    '--radius-lg': `${tokens.radius.lg}px`,
    '--radius-full': `${tokens.radius.full}px`,
    '--elevation-none': String(tokens.elevation.none),
    '--elevation-sm': String(tokens.elevation.sm),
    '--elevation-md': String(tokens.elevation.md),
    '--elevation-lg': String(tokens.elevation.lg),
    '--font-display-size': `${tokens.typography.display.fontSize}px`,
    '--font-heading1-size': `${tokens.typography.heading1.fontSize}px`,
    '--font-heading2-size': `${tokens.typography.heading2.fontSize}px`,
    '--font-heading3-size': `${tokens.typography.heading3.fontSize}px`,
    '--font-body-size': `${tokens.typography.body.fontSize}px`,
    '--font-body-small-size': `${tokens.typography.bodySmall.fontSize}px`,
    '--font-caption-size': `${tokens.typography.caption.fontSize}px`,
    '--font-label-size': `${tokens.typography.label.fontSize}px`,
  };
}

/** CSS `:root` / `[data-theme]` block string for injection into Admin global styles. */
export function buildThemeCssBlock(
  mode: ColorMode,
  tokens: DesignTokens,
): string {
  const vars = tokensToCssVariables(tokens);
  const selector = mode === 'dark' ? '[data-theme="dark"]' : ':root, [data-theme="light"]';
  const body = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
  return `${selector} {\n${body}\n}`;
}
