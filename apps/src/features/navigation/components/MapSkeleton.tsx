import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/Skeleton';
import { useTheme } from '@/hooks/useTheme';

/** Map skeleton — UI-API MapSkeleton. */
export function MapSkeleton() {
  const { tokens } = useTheme();
  return (
    <View accessibilityLabel="Loading map">
      <Skeleton.Block width="100%" height={160} />
      <View style={{ height: tokens.spacing.sm }} />
      <Skeleton.Block width="70%" height={16} />
    </View>
  );
}
