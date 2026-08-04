import React, { useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Text } from './Text';

export type ToastProps = {
  message: string;
  open: boolean;
  onClose: () => void;
  variant?: 'info' | 'success' | 'error' | 'warning';
  'aria-label': string;
  durationMs?: number;
};

export function Toast({
  message,
  open,
  onClose,
  variant = 'info',
  'aria-label': ariaLabel,
  durationMs = 3000,
}: ToastProps) {
  const { tokens } = useTheme();

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(handle);
  }, [open, durationMs, onClose]);

  if (!open) return null;

  const backgroundColor =
    variant === 'success'
      ? tokens.color.success
      : variant === 'error'
        ? tokens.color.error
        : variant === 'warning'
          ? tokens.color.warning
          : tokens.color.accent;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      style={{
        position: 'fixed',
        left: tokens.spacing.lg,
        right: tokens.spacing.lg,
        bottom: tokens.spacing.xxl,
        zIndex: 1100,
        background: backgroundColor,
        color: tokens.color.textInverse,
        borderRadius: tokens.radius.md,
        padding: tokens.spacing.md,
        minHeight: 44,
      }}
    >
      <Text as="span" variant="body" color={tokens.color.textInverse}>
        {message}
      </Text>
    </div>
  );
}
