import React, { type ReactNode } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';
import { Text } from './Text';

export type EmptyStateProps = {
  title: string;
  description?: string;
  illustration?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  'aria-label': string;
};

export function EmptyState({
  title,
  description,
  illustration,
  actionLabel,
  onAction,
  'aria-label': ariaLabel,
}: EmptyStateProps) {
  const { tokens } = useTheme();
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      style={{
        display: 'grid',
        justifyItems: 'center',
        gap: tokens.spacing.md,
        padding: tokens.spacing.xl,
        textAlign: 'center',
      }}
    >
      {illustration}
      <Text as="h2" variant="heading2">
        {title}
      </Text>
      {description ? (
        <Text variant="body" color={tokens.color.textSecondary}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} aria-label={actionLabel} onClick={onAction} />
      ) : null}
    </div>
  );
}
