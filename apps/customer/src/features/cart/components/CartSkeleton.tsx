import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

/** UI-API CartSkeleton — P2-CUS-03. */
export function CartSkeleton({ count = 4 }: { count?: number }) {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }} accessibilityLabel="Loading cart">
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
          <Skeleton.Block width="55%" height={18} />
          <Skeleton.Block width="30%" height={14} />
          <Skeleton.Block width="40%" height={14} />
        </View>
      ))}
      <Skeleton.Block width="45%" height={22} />
    </View>
  );
}
