import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

export function MenuManageSkeleton() {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ gap: tokens.spacing.xs }}>
          <Skeleton.Block width="55%" height={18} />
          <Skeleton.Block width="35%" height={14} />
        </View>
      ))}
    </View>
  );
}
