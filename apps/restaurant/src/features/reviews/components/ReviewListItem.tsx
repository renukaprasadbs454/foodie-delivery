import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';
import type { RestaurantReview } from '../types';

type Props = {
  review: RestaurantReview;
};

const BRAND_PRIMARY = '#14532D';
const BRAND_ACCENT = '#F59E0B';

export function ReviewListItem({ review }: Props) {
  const { tokens } = useTheme();

  return (
    <View
      style={{
        padding: tokens.spacing.md,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: tokens.color.border,
        borderLeftWidth: 4,
        borderLeftColor: BRAND_ACCENT,
        backgroundColor: tokens.color.surface,
        gap: tokens.spacing.xs,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      }}
      accessibilityLabel={`Review ${review.restaurantRating} stars`}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ color: BRAND_ACCENT, fontSize: 18 }}>★</Text>
          <Text variant="label" style={{ fontSize: 16, color: BRAND_PRIMARY, fontWeight: 'bold' }}>
            {review.restaurantRating}.0 Rating
          </Text>
        </View>

        {review.createdAt ? (
          <Text variant="caption" color={tokens.color.textSecondary}>
            {new Date(review.createdAt).toLocaleDateString()}
          </Text>
        ) : null}
      </View>

      {review.deliveryRating != null ? (
        <Text variant="caption" style={{ color: '#475569' }}>
          Delivery Rating: <Text style={{ color: BRAND_ACCENT, fontWeight: 'bold' }}>★ {review.deliveryRating}</Text>
        </Text>
      ) : null}

      {review.comment ? (
        <Text variant="body" style={{ color: tokens.color.textPrimary, marginTop: 2 }}>
          "{review.comment}"
        </Text>
      ) : (
        <Text variant="caption" color={tokens.color.textSecondary} style={{ italic: true } as never}>
          No written comment provided.
        </Text>
      )}
    </View>
  );
}

