import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

export function RestaurantProfileSkeleton() {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }}>
      <Skeleton.Circle size={72} />
      <Skeleton.Block width="60%" height={24} />
      <Skeleton.Block width="100%" height={48} />
      <Skeleton.Block width="100%" height={48} />
      <Skeleton.Block width="80%" height={48} />
    </View>
  );
}
