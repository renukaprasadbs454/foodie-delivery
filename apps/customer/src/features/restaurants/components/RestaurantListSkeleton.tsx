import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

/** UI-API RestaurantListSkeleton — P2-CUS-01. */
export function RestaurantListSkeleton({ count = 6 }: { count?: number }) {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }} accessibilityLabel="Loading restaurants">
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{
            gap: tokens.spacing.sm,
            padding: tokens.spacing.md,
            borderRadius: tokens.radius.md,
            borderWidth: 1,
            borderColor: tokens.color.border,
          }}
        >
          <Skeleton.Block width="70%" height={20} />
          <Skeleton.Block width="40%" height={14} />
          <Skeleton.Block width="100%" height={12} />
        </View>
      ))}
    </View>
  );
}
