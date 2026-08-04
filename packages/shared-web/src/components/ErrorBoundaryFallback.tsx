import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';
import { Text } from './Text';

export type ErrorBoundaryFallbackProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Shared recovery UI for Next.js error.tsx tiers — Blueprint §27.2. */
export function ErrorBoundaryFallback({
  title = 'Something went wrong',
  description = 'Please try again. If the problem continues, reload the page.',
  actionLabel = 'Try again',
  onAction,
}: ErrorBoundaryFallbackProps) {
  const { tokens } = useTheme();
  return (
    <div
      role="alert"
      style={{
        minHeight: '40vh',
        display: 'grid',
        placeContent: 'center',
        justifyItems: 'center',
        gap: tokens.spacing.md,
        padding: tokens.spacing.xl,
        background: tokens.color.background,
        textAlign: 'center',
      }}
    >
      <Text as="h1" variant="heading1">
        {title}
      </Text>
      <Text variant="body" color={tokens.color.textSecondary}>
        {description}
      </Text>
      {onAction ? (
        <Button label={actionLabel} aria-label={actionLabel} onClick={onAction} />
      ) : null}
    </div>
  );
}
