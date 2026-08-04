import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

/** Assignment detail skeleton — UI-API AssignmentDetailSkeleton. */
export function AssignmentDetailSkeleton() {
  const { tokens } = useTheme();
  return (
    <View
      style={{ gap: tokens.spacing.md }}
      accessibilityLabel="Loading assignment"
    >
      <Skeleton.Block width="50%" height={28} />
      <Skeleton.Block width="100%" height={120} />
      <Skeleton.Block width="100%" height={48} />
    </View>
  );
}
