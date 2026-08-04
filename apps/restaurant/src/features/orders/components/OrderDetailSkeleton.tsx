import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

export function OrderDetailSkeleton() {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }}>
      <Skeleton.Block width="55%" height={28} />
      <Skeleton.Block width="30%" height={16} />
      <Skeleton.Block width="100%" height={80} />
      <Skeleton.Block width="100%" height={120} />
    </View>
  );
}
