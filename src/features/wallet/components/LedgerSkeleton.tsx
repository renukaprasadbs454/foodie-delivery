import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/Skeleton';
import { useTheme } from '@/hooks/useTheme';

/** Ledger list skeleton — UI-API LedgerSkeleton. */
export function LedgerSkeleton() {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }} accessibilityLabel="Loading ledger">
      <Skeleton.Block width="100%" height={64} />
      <Skeleton.Block width="100%" height={64} />
      <Skeleton.Block width="100%" height={64} />
    </View>
  );
}
