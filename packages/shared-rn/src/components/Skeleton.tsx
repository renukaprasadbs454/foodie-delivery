import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

type CommonProps = {
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBlock({
  width = '100%',
  height = 16,
  style,
}: CommonProps & { width?: number | `${number}%` | '100%'; height?: number }) {
  const { tokens } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: tokens.radius.sm,
          backgroundColor: tokens.color.border,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCircle({
  size = 40,
  style,
}: CommonProps & { size?: number }) {
  const { tokens } = useTheme();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: size,
          height: size,
          borderRadius: tokens.radius.full,
          backgroundColor: tokens.color.border,
        },
        style,
      ]}
    />
  );
}

export function SkeletonText({
  lines = 3,
  style,
}: CommonProps & { lines?: number }) {
  const { tokens } = useTheme();
  return (
    <View style={[{ gap: tokens.spacing.sm }, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBlock
          key={`skeleton-line-${index}`}
          height={tokens.typography.body.fontSize}
          width={index === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </View>
  );
}

export const Skeleton = {
  Block: SkeletonBlock,
  Circle: SkeletonCircle,
  Text: SkeletonText,
};
