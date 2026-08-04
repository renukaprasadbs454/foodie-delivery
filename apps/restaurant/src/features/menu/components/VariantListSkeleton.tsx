import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

export function VariantListSkeleton() {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }}>
      {[0, 1].map((i) => (
        <Skeleton.Block key={i} width="100%" height={48} />
      ))}
    </View>
  );
}
