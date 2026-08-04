import React from 'react';
import { useTheme } from '../hooks/useTheme';

export function Divider() {
  const { tokens } = useTheme();
  return (
    <hr
      aria-hidden
      style={{
        border: 'none',
        borderTop: `1px solid ${tokens.color.border}`,
        margin: `${tokens.spacing.md}px 0`,
        width: '100%',
      }}
    />
  );
}
