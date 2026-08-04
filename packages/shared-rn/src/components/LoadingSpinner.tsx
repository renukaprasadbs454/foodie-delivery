import React from 'react';
import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export type LoadingSpinnerProps = {
  size?: 'small' | 'large';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function LoadingSpinner({
  size = 'large',
  accessibilityLabel = 'Loading',
  style,
}: LoadingSpinnerProps) {
  const { tokens } = useTheme();
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      style={[{ alignItems: 'center', justifyContent: 'center' }, style]}
    >
      <ActivityIndicator size={size} color={tokens.color.accent} />
    </View>
  );
}
