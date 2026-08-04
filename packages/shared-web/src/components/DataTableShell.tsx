import React, { type ReactNode } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Text } from './Text';

/**
 * Accessible table shell for Admin data tables — System Design §27 Admin a11y.
 * Column/row content is supplied by Admin features; this is a primitive shell only.
 */
export type DataTableShellProps = {
  caption: string;
  headers: string[];
  children: ReactNode;
};

export function DataTableShell({
  caption,
  headers,
  children,
}: DataTableShellProps) {
  const { tokens } = useTheme();
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          color: tokens.color.textPrimary,
        }}
      >
        <caption style={{ textAlign: 'left', paddingBottom: tokens.spacing.sm }}>
          <Text as="span" variant="heading3">
            {caption}
          </Text>
        </caption>
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                scope="col"
                style={{
                  textAlign: 'left',
                  padding: tokens.spacing.md,
                  borderBottom: `1px solid ${tokens.color.border}`,
                  background: tokens.color.surface,
                }}
              >
                <Text as="span" variant="label">
                  {header}
                </Text>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}
