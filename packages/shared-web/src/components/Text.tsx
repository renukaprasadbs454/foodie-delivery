import React, { type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { TypographyVariant } from '../theme/tokens';

export type TextProps = HTMLAttributes<HTMLElement> & {
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'label' | 'div';
  variant?: TypographyVariant;
  color?: string;
  children?: ReactNode;
  htmlFor?: string;
};

export function Text({
  as: Component = 'p',
  variant = 'body',
  color,
  style,
  children,
  htmlFor,
  ...rest
}: TextProps) {
  const { tokens } = useTheme();
  const typography = tokens.typography[variant];
  const computed: CSSProperties = {
    margin: 0,
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSize,
    fontWeight: typography.fontWeight,
    lineHeight: `${typography.lineHeight}px`,
    color: color ?? tokens.color.textPrimary,
    ...style,
  };
  return (
    <Component {...rest} htmlFor={htmlFor} style={computed}>
      {children}
    </Component>
  );
}
