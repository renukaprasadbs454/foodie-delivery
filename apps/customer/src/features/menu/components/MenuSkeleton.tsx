import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

/** UI-API MenuSkeleton — P2-CUS-02. */
export function MenuSkeleton({ count = 8 }: { count?: number }) {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }} accessibilityLabel="Loading menu">
      <Skeleton.Block width="40%" height={22} />
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{
            gap: tokens.spacing.sm,
            paddingVertical: tokens.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: tokens.color.border,
          }}
        >
          <Skeleton.Block width="65%" height={18} />
          <Skeleton.Block width="90%" height={12} />
          <Skeleton.Block width="25%" height={14} />
        </View>
      ))}
    </View>
  );
}
