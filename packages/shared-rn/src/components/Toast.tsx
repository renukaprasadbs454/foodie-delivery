import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Text } from './Text';

export type ToastProps = {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  variant?: 'info' | 'success' | 'error' | 'warning';
  accessibilityLabel: string;
  durationMs?: number;
};

export function Toast({
  message,
  visible,
  onDismiss,
  variant = 'info',
  accessibilityLabel,
  durationMs = 3000,
}: ToastProps) {
  const { tokens } = useTheme();

  useEffect(() => {
    if (!visible) return;
    const handle = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(handle);
  }, [visible, durationMs, onDismiss]);

  if (!visible) return null;

  const backgroundColor =
    variant === 'success'
      ? tokens.color.success
      : variant === 'error'
        ? tokens.color.error
        : variant === 'warning'
          ? tokens.color.warning
          : tokens.color.accent;

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: tokens.spacing.lg,
        right: tokens.spacing.lg,
        bottom: tokens.spacing.xxl,
        zIndex: 1000,
      }}
    >
      <Pressable
        onPress={onDismiss}
        accessibilityRole="alert"
        accessibilityLabel={accessibilityLabel}
        style={{
          backgroundColor,
          borderRadius: tokens.radius.md,
          padding: tokens.spacing.md,
          minHeight: 48,
          justifyContent: 'center',
        }}
      >
        <Text variant="body" color={tokens.color.textInverse}>
          {message}
        </Text>
      </Pressable>
    </View>
  );
}
