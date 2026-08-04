import React, { type ReactNode } from 'react';
import {
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Text } from './Text';

export type CardProps = {
  title?: string;
  subtitle?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Composition-friendly Card — Blueprint §4 / §18 (children slot, not flag explosion). */
export function Card({
  title,
  subtitle,
  onPress,
  accessibilityLabel,
  children,
  style,
}: CardProps) {
  const { tokens } = useTheme();
  const content = (
    <>
      {title ? <Text variant="heading3">{title}</Text> : null}
      {subtitle ? (
        <Text variant="bodySmall" color={tokens.color.textSecondary}>
          {subtitle}
        </Text>
      ) : null}
      {children}
    </>
  );

  const baseStyle: ViewStyle = {
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.color.border,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title ?? 'Card'}
        style={[baseStyle, style]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[baseStyle, style]}>{content}</View>;
}
