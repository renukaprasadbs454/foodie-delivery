import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

/** UI-API CheckoutSkeleton — P2-CUS-04. */
export function CheckoutSkeleton() {
  const { tokens } = useTheme();
  return (
    <View
      style={{ gap: tokens.spacing.md }}
      accessibilityLabel="Loading checkout"
    >
      <Skeleton.Block width="40%" height={24} />
      <Skeleton.Block width="100%" height={72} />
      <Skeleton.Block width="100%" height={72} />
      <Skeleton.Block width="50%" height={20} />
      <Skeleton.Block width="100%" height={48} />
      <Skeleton.Block width="60%" height={22} />
    </View>
  );
}
