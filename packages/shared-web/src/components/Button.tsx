import React, { type ButtonHTMLAttributes } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Text } from './Text';

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  label: string;
  /** Required for accessibility — Blueprint §43. */
  'aria-label': string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Button({
  label,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const { tokens } = useTheme();
  const isDisabled = disabled || loading;
  const backgroundColor =
    variant === 'primary'
      ? tokens.color.accent
      : variant === 'danger'
        ? tokens.color.error
        : tokens.color.surface;
  const textColor =
    variant === 'secondary' ? tokens.color.textPrimary : tokens.color.textInverse;

  return (
    <button
      type="button"
      {...rest}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      style={{
        minHeight: 44,
        minWidth: 44,
        padding: `${tokens.spacing.md}px ${tokens.spacing.lg}px`,
        borderRadius: tokens.radius.md,
        border:
          variant === 'secondary' ? `1px solid ${tokens.color.border}` : 'none',
        backgroundColor,
        color: textColor,
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      <Text as="span" variant="label" color={textColor}>
        {loading ? 'Loading…' : label}
      </Text>
    </button>
  );
}
