import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/Skeleton';
import { useTheme } from '@/hooks/useTheme';

/** Home skeleton — UI-API DeliveryHomeSkeleton. */
export function DeliveryHomeSkeleton() {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }} accessibilityLabel="Loading home">
      <Skeleton.Block width="60%" height={28} />
      <Skeleton.Block width="100%" height={72} />
      <Skeleton.Block width="100%" height={96} />
    </View>
  );
}
