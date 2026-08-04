import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

export function OrderQueueSkeleton() {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            gap: tokens.spacing.sm,
            padding: tokens.spacing.md,
            borderRadius: tokens.radius.md,
            borderWidth: 1,
            borderColor: tokens.color.border,
          }}
        >
          <Skeleton.Block width="40%" height={16} />
          <Skeleton.Block width="70%" height={14} />
        </View>
      ))}
    </View>
  );
}
