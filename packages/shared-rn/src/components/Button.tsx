import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Text } from './Text';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  accessibilityLabel: string;
  accessibilityHint?: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  accessibilityLabel,
  accessibilityHint,
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
    <Pressable
      {...rest}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(isDisabled), busy: loading }}
      style={[
        {
          minHeight: 48,
          minWidth: 48,
          paddingHorizontal: tokens.spacing.lg,
          paddingVertical: tokens.spacing.md,
          borderRadius: tokens.radius.md,
          backgroundColor,
          opacity: isDisabled ? 0.5 : 1,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: variant === 'secondary' ? 1 : 0,
          borderColor: tokens.color.border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text variant="label" color={textColor}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
