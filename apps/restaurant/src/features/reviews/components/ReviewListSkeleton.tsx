import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

export function ReviewListSkeleton() {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ gap: tokens.spacing.sm }}>
          <Skeleton.Block width="30%" height={16} />
          <Skeleton.Block width="100%" height={40} />
        </View>
      ))}
    </View>
  );
}
