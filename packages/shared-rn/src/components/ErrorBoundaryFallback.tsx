import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';
import { Text } from './Text';

export type ErrorBoundaryFallbackProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'root' | 'screen';
};

/**
 * Recovery UI for Blueprint §27 error boundaries.
 * Boundaries themselves live in each app; this is the shared fallback view.
 */
export function ErrorBoundaryFallback({
  title = 'Something went wrong',
  description = 'Please try again. If the problem continues, restart the app.',
  actionLabel = 'Try again',
  onAction,
  variant = 'screen',
}: ErrorBoundaryFallbackProps) {
  const { tokens } = useTheme();

  return (
    <View
      accessibilityRole="alert"
      accessibilityLabel={title}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: tokens.spacing.xl,
        gap: tokens.spacing.md,
        backgroundColor: tokens.color.background,
      }}
    >
      <Text variant={variant === 'root' ? 'heading1' : 'heading2'}>{title}</Text>
      <Text
        variant="body"
        color={tokens.color.textSecondary}
        style={{ textAlign: 'center' }}
      >
        {description}
      </Text>
      {onAction ? (
        <Button
          label={actionLabel}
          accessibilityLabel={actionLabel}
          onPress={onAction}
        />
      ) : null}
    </View>
  );
}
