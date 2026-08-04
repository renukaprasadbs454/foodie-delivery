import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Text } from './Text';

export type BadgeProps = {
  label: string;
  tone?: 'accent' | 'success' | 'error' | 'warning' | 'neutral';
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

export function Badge({
  label,
  tone = 'accent',
  accessibilityLabel,
  style,
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
    <View
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          alignSelf: 'flex-start',
          paddingHorizontal: tokens.spacing.sm,
          paddingVertical: tokens.spacing.xs,
          borderRadius: tokens.radius.full,
          backgroundColor,
          minHeight: 24,
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        variant="caption"
        color={
          tone === 'neutral' ? tokens.color.textPrimary : tokens.color.textInverse
        }
      >
        {label}
      </Text>
    </View>
  );
}
