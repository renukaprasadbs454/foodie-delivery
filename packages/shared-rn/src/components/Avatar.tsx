import React from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Text } from './Text';

export type AvatarProps = {
  uri?: string | null;
  initials?: string;
  size?: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

export function Avatar({
  uri,
  initials,
  size = 40,
  accessibilityLabel,
  style,
}: AvatarProps) {
  const { tokens } = useTheme();

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          width: size,
          height: size,
          borderRadius: tokens.radius.full,
          backgroundColor: tokens.color.accentMuted,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} />
      ) : (
        <Text variant="label" color={tokens.color.accent}>
          {(initials ?? '?').slice(0, 2).toUpperCase()}
        </Text>
      )}
    </View>
  );
}
