import React from 'react';
import { View } from 'react-native';
import { Text, formatMoneyInr, useTheme } from 'foodie-shared-rn';
import type { LedgerEntry } from '../types';
import { parseMoneyAmount } from '../types';

type Props = {
  entry: LedgerEntry;
};

/** Ledger row — UI-API LedgerRow. */
export function LedgerRow({ entry }: Props) {
  const { tokens } = useTheme();
  const amount = parseMoneyAmount(entry.amount);
  const credit = entry.entryType === 'CREDIT';
  const signed =
    amount === null
      ? '—'
      : `${credit ? '+' : '-'}${formatMoneyInr(Math.abs(amount))}`;

  return (
    <View
      style={{
        padding: tokens.spacing.md,
        borderWidth: 1,
        borderColor: tokens.color.border,
        borderRadius: tokens.radius.sm,
        backgroundColor: tokens.color.surface,
        gap: tokens.spacing.xs,
      }}
      accessibilityLabel={`${entry.entryType} ${signed}`}
    >
      <Text variant="body">
        {entry.entryType} · {entry.referenceType}
      </Text>
      <Text
        variant="heading3"
        color={credit ? tokens.color.success : tokens.color.textPrimary}
      >
        {signed}
      </Text>
      <Text variant="caption" color={tokens.color.textSecondary}>
        {entry.createdAt
          ? new Date(entry.createdAt).toLocaleString()
          : '—'}
      </Text>
    </View>
  );
}
