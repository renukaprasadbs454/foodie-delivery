import React from 'react';
import { View } from 'react-native';
import { Skeleton } from '@/components/Skeleton';
import { useTheme } from '@/hooks/useTheme';

/** Offers list skeleton — UI-API OfferListSkeleton. */
export function OfferListSkeleton() {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.md }} accessibilityLabel="Loading offers">
      <Skeleton.Block width="100%" height={112} />
      <Skeleton.Block width="100%" height={112} />
      <Skeleton.Block width="100%" height={112} />
    </View>
  );
}
