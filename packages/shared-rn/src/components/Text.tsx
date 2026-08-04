import React from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { TypographyVariant } from '../theme/tokens';

export type TextProps = Omit<RNTextProps, 'style'> & {
  variant?: TypographyVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
};

/**
 * Shared Text primitive — Blueprint §21.
 * No free-form fontSize prop; variants only.
 */
export function Text({
  variant = 'body',
  color,
  style,
  children,
  ...rest
}: TextProps) {
  const { tokens } = useTheme();
  const typography = tokens.typography[variant];

  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: typography.fontFamily,
          fontSize: typography.fontSize,
          fontWeight: typography.fontWeight,
          lineHeight: typography.lineHeight,
          color: color ?? tokens.color.textPrimary,
        },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
