import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Card, Text, useTheme } from 'foodie-shared-rn';
import type { RestaurantReview } from '../types';

type Props = {
  reviews: RestaurantReview[];
};

const BRAND_PRIMARY = '#14532D'; // Dark Green
const BRAND_ACCENT = '#F59E0B';  // Gold

export function ReviewSummaryCards({ reviews }: Props) {
  const { tokens } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const totalCount = reviews.length;

  const avgRatingNum = useMemo(() => {
    if (!totalCount) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + (Number(r.restaurantRating) || 0), 0);
    return sum / totalCount;
  }, [reviews, totalCount]);

  const avgRating = avgRatingNum.toFixed(1);

  const positiveCount = useMemo(
    () => reviews.filter((r) => r.restaurantRating >= 4).length,
    [reviews],
  );

  const positivePct = totalCount
    ? Math.round((positiveCount / totalCount) * 100)
    : 100;

  const needsImpCount = useMemo(
    () => reviews.filter((r) => r.restaurantRating < 4).length,
    [reviews],
  );

  const needsImpPct = totalCount
    ? Math.round((needsImpCount / totalCount) * 100)
    : 0;

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: tokens.spacing.sm,
      }}
    >
      {/* 1. AVERAGE RATING CARD */}
      <Card
        style={{
          flex: isWide ? 1 : undefined,
          width: isWide ? undefined : '48%',
          padding: tokens.spacing.md,
          borderRadius: 14,
          borderLeftWidth: 4,
          borderLeftColor: BRAND_ACCENT,
          backgroundColor: '#FEF3C7',
          gap: 4,
        }}
      >
        <Text variant="caption" style={{ color: '#92400E', fontWeight: 'bold' }}>
          Average Rating
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text variant="heading1" style={{ color: '#92400E', fontSize: 26, fontWeight: 'bold' }}>
            ⭐ {avgRating}
          </Text>
          <Text variant="caption" style={{ color: '#B45309' }}>
            / 5.0
          </Text>
        </View>
        <Text variant="caption" style={{ color: '#B45309' }}>
          Based on {totalCount} verified reviews
        </Text>
      </Card>

      {/* 2. TOTAL REVIEWS CARD */}
      <Card
        style={{
          flex: isWide ? 1 : undefined,
          width: isWide ? undefined : '48%',
          padding: tokens.spacing.md,
          borderRadius: 14,
          borderLeftWidth: 4,
          borderLeftColor: BRAND_PRIMARY,
          gap: 4,
        }}
      >
        <Text variant="caption" color={tokens.color.textSecondary}>
          Total Feedback
        </Text>
        <Text variant="heading1" style={{ color: BRAND_PRIMARY, fontSize: 26, fontWeight: 'bold' }}>
          {totalCount}
        </Text>
        <Text variant="caption" color={tokens.color.textSecondary}>
          Customer ratings received
        </Text>
      </Card>

      {/* 3. POSITIVE REVIEWS CARD */}
      <Card
        style={{
          flex: isWide ? 1 : undefined,
          width: isWide ? undefined : '48%',
          padding: tokens.spacing.md,
          borderRadius: 14,
          borderLeftWidth: 4,
          borderLeftColor: '#16A34A',
          gap: 4,
        }}
      >
        <Text variant="caption" color={tokens.color.textSecondary}>
          Positive Reviews
        </Text>
        <Text variant="heading1" style={{ color: '#16A34A', fontSize: 26, fontWeight: 'bold' }}>
          {positiveCount}
        </Text>
        <Text variant="caption" style={{ color: '#16A34A', fontWeight: '600' }}>
          {positivePct}% (4★ & 5★ ratings)
        </Text>
      </Card>

      {/* 4. NEEDS IMPROVEMENT CARD */}
      <Card
        style={{
          flex: isWide ? 1 : undefined,
          width: isWide ? undefined : '48%',
          padding: tokens.spacing.md,
          borderRadius: 14,
          borderLeftWidth: 4,
          borderLeftColor: needsImpCount > 0 ? '#DC2626' : '#94A3B8',
          gap: 4,
        }}
      >
        <Text variant="caption" color={tokens.color.textSecondary}>
          Needs Improvement
        </Text>
        <Text
          variant="heading1"
          style={{
            color: needsImpCount > 0 ? '#DC2626' : tokens.color.textPrimary,
            fontSize: 26,
            fontWeight: 'bold',
          }}
        >
          {needsImpCount}
        </Text>
        <Text
          variant="caption"
          style={{
            color: needsImpCount > 0 ? '#DC2626' : tokens.color.textSecondary,
            fontWeight: '600',
          }}
        >
          {needsImpPct}% (1★ to 3★ ratings)
        </Text>
      </Card>
    </View>
  );
}
