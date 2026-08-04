import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

/** Profile screen skeleton. */
export function ProfileSkeleton() {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }} accessibilityLabel="Profile loading">
      <Skeleton.Circle size={72} />
      <Skeleton.Block width="60%" height={24} />
      <Skeleton.Block width="100%" height={48} />
      <Skeleton.Block width="100%" height={48} />
      <Skeleton.Block width="100%" height={48} />
    </View>
  );
}
