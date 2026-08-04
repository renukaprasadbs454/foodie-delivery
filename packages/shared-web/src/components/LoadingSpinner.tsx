import React from 'react';
import { useTheme } from '../hooks/useTheme';

export type LoadingSpinnerProps = {
  'aria-label'?: string;
};

export function LoadingSpinner({
  'aria-label': ariaLabel = 'Loading',
}: LoadingSpinnerProps) {
  const { tokens } = useTheme();
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: `3px solid ${tokens.color.border}`,
        borderTopColor: tokens.color.accent,
        animation: 'foodie-spin 0.8s linear infinite',
      }}
    />
  );
}
