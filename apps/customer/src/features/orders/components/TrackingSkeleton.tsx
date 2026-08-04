import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

/** Live tracking skeleton. */
export function TrackingSkeleton() {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }} accessibilityLabel="Tracking loading">
      <Skeleton.Block width="100%" height={200} />
      <Skeleton.Block width="100%" height={160} />
      <Skeleton.Block width="100%" height={48} />
    </View>
  );
}
