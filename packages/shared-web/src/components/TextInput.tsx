import React, { type InputHTMLAttributes } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Text } from './Text';

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'style'> & {
  label?: string;
  errorText?: string;
  'aria-label': string;
};

export function TextInput({
  label,
  errorText,
  disabled,
  id,
  ...rest
}: TextInputProps) {
  const { tokens } = useTheme();
  const inputId = id ?? rest.name;

  return (
    <div style={{ display: 'grid', gap: tokens.spacing.xs }}>
      {label ? (
        <Text as="label" variant="label" color={tokens.color.textSecondary} htmlFor={inputId}>
          {label}
        </Text>
      ) : null}
      <input
        {...rest}
        id={inputId}
        disabled={disabled}
        aria-invalid={Boolean(errorText) || undefined}
        style={{
          minHeight: 44,
          border: `1px solid ${errorText ? tokens.color.error : tokens.color.border}`,
          borderRadius: tokens.radius.md,
          padding: `0 ${tokens.spacing.md}px`,
          color: tokens.color.textPrimary,
          background: tokens.color.surface,
          opacity: disabled ? 0.6 : 1,
          fontSize: tokens.typography.body.fontSize,
        }}
      />
      {errorText ? (
        <Text as="span" variant="caption" color={tokens.color.error} role="alert">
          {errorText}
        </Text>
      ) : null}
    </div>
  );
}
