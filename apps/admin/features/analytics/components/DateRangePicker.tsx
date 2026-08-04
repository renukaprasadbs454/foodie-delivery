'use client';

import React from 'react';
import { Text, useTheme } from 'foodie-shared-web';
import type { AnalyticsDateRange } from '../types';

type Props = {
  value: AnalyticsDateRange;
  onChange: (next: AnalyticsDateRange) => void;
  disabled?: boolean;
};

/** Local date range — UI-API DateRangePicker (feature-local). */
export function DateRangePicker({ value, onChange, disabled }: Props) {
  const { tokens } = useTheme();

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: tokens.spacing.md,
        alignItems: 'end',
      }}
    >
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Text as="span" variant="label">
          From
        </Text>
        <input
          type="date"
          value={value.dateFrom}
          disabled={disabled}
          aria-label="Date from"
          onChange={(e) =>
            onChange({ ...value, dateFrom: e.target.value })
          }
          style={{
            padding: tokens.spacing.sm,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.sm,
          }}
        />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Text as="span" variant="label">
          To
        </Text>
        <input
          type="date"
          value={value.dateTo}
          disabled={disabled}
          aria-label="Date to"
          onChange={(e) => onChange({ ...value, dateTo: e.target.value })}
          style={{
            padding: tokens.spacing.sm,
            border: `1px solid ${tokens.color.border}`,
            borderRadius: tokens.radius.sm,
          }}
        />
      </label>
    </div>
  );
}
