import React from 'react';
import { View } from 'react-native';
import { Skeleton, useTheme } from 'foodie-shared-rn';

/** Notifications inbox skeleton. */
export function NotificationListSkeleton() {
  const { tokens } = useTheme();
  return (
    <View
      style={{ gap: tokens.spacing.md }}
      accessibilityLabel="Notifications loading"
    >
      {[0, 1, 2, 3].map((i) => (
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
          <Skeleton.Block width="55%" height={16} />
          <Skeleton.Block width="100%" height={36} />
          <Skeleton.Block width="35%" height={12} />
        </View>
      ))}
    </View>
  );
}
