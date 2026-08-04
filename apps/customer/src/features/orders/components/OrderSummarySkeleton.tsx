import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

/** Order Success brief skeleton. */
export function OrderSummarySkeleton() {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }} accessibilityLabel="Order summary loading">
      <Skeleton.Block width="60%" height={28} />
      <Skeleton.Block width="100%" height={120} />
      <Skeleton.Block width="100%" height={48} />
    </View>
  );
}
