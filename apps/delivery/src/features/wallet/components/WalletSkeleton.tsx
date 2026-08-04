import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

/** Balance skeleton — UI-API WalletSkeleton. */
export function WalletSkeleton() {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }} accessibilityLabel="Loading wallet">
      <Skeleton.Block width="40%" height={20} />
      <Skeleton.Block width="60%" height={36} />
      <Skeleton.Block width="100%" height={48} />
    </View>
  );
}
