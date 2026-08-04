import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { Text } from './Text';

export type BadgeProps = {
  label: string;
  tone?: 'accent' | 'success' | 'error' | 'warning' | 'neutral';
  'aria-label': string;
};

export function Badge({
  label,
  tone = 'accent',
  'aria-label': ariaLabel,
}: BadgeProps) {
  const { tokens } = useTheme();
  const backgroundColor =
    tone === 'success'
      ? tokens.color.success
      : tone === 'error'
        ? tokens.color.error
        : tone === 'warning'
          ? tokens.color.warning
          : tone === 'neutral'
            ? tokens.color.border
            : tokens.color.accent;

  return (
    <span
      aria-label={ariaLabel}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
        borderRadius: tokens.radius.full,
        background: backgroundColor,
        minHeight: 24,
      }}
    >
      <Text
        as="span"
        variant="caption"
        color={
          tone === 'neutral' ? tokens.color.textPrimary : tokens.color.textInverse
        }
      >
        {label}
      </Text>
    </span>
  );
}
