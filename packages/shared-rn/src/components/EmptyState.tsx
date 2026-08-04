import React, { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Button } from './Button';
import { Text } from './Text';

export type EmptyStateProps = {
  title: string;
  description?: string;
  illustration?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({
  title,
  description,
  illustration,
  actionLabel,
  onAction,
  accessibilityLabel,
  style,
}: EmptyStateProps) {
  const { tokens } = useTheme();

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          padding: tokens.spacing.xl,
          gap: tokens.spacing.md,
        },
        style,
      ]}
    >
      {illustration}
      <Text variant="heading2">{title}</Text>
      {description ? (
        <Text
          variant="body"
          color={tokens.color.textSecondary}
          style={{ textAlign: 'center' }}
        >
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          accessibilityLabel={actionLabel}
          onPress={onAction}
        />
      ) : null}
    </View>
  );
}
