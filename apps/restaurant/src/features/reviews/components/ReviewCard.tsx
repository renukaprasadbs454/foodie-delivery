import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Text, useTheme } from 'foodie-shared-rn';
import type { RestaurantReview } from '../types';

type ExtendedReview = RestaurantReview & {
  customerName?: string;
  verified?: boolean;
  orderInfo?: string;
  itemInfo?: string;
};

type Props = {
  review: RestaurantReview;
  onPress?: (review: RestaurantReview) => void;
};

const BRAND_PRIMARY = '#14532D'; // Dark Green
const BRAND_ACCENT = '#F59E0B';  // Gold

export function ReviewCard({ review, onPress }: Props) {
  const { tokens } = useTheme();
  const ext = review as ExtendedReview;

  const rating = Number(review.restaurantRating) || 5;
  const starsString = '★'.repeat(Math.min(5, Math.max(1, Math.round(rating))));
  const customerDisplayName = ext.customerName ?? 'Verified Customer';

  return (
    <Pressable
      onPress={() => onPress?.(review)}
      accessibilityRole="button"
      accessibilityLabel={`Review ${rating} stars by ${customerDisplayName}`}
      style={{
        padding: tokens.spacing.md,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: tokens.color.border,
        borderLeftWidth: 4,
        borderLeftColor: rating >= 4 ? BRAND_PRIMARY : rating === 3 ? BRAND_ACCENT : '#DC2626',
        backgroundColor: tokens.color.surface,
        gap: tokens.spacing.xs,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* CARD HEADER */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm }}>
          {/* Avatar Circle */}
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#DCFCE7',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: BRAND_PRIMARY,
            }}
          >
            <Text variant="label" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
              {customerDisplayName.slice(0, 1).toUpperCase()}
            </Text>
          </View>

          <View style={{ gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text variant="label" style={{ color: tokens.color.textPrimary, fontWeight: 'bold', fontSize: 15 }}>
                {customerDisplayName}
              </Text>
              {ext.verified !== false ? (
                <View
                  style={{
                    backgroundColor: '#DCFCE7',
                    paddingHorizontal: 6,
                    paddingVertical: 1,
                    borderRadius: 8,
                  }}
                >
                  <Text variant="caption" style={{ color: BRAND_PRIMARY, fontWeight: 'bold', fontSize: 10 }}>
                    ✓ Verified
                  </Text>
                </View>
              ) : null}
            </View>

            <Text variant="caption" color={tokens.color.textSecondary}>
              📅 {review.createdAt ? new Date(review.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent Order'}
            </Text>
          </View>
        </View>

        {/* STARS BADGE */}
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={{ color: BRAND_ACCENT, fontSize: 16, fontWeight: 'bold' }}>
            {starsString}
          </Text>
          <Text variant="caption" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
            {rating}.0 / 5.0
          </Text>
        </View>
      </View>

      {/* ITEM / ORDER INFO IF PRESENT */}
      {ext.itemInfo ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Text variant="caption" style={{ color: BRAND_PRIMARY, fontWeight: '600' }}>
            🍽️ Ordered: {ext.itemInfo}
          </Text>
        </View>
      ) : null}

      {/* DELIVERY RATING BADGE IF PRESENT */}
      {review.deliveryRating != null ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <Text variant="caption" color={tokens.color.textSecondary}>
            Delivery Service Rating:
          </Text>
          <Text variant="caption" style={{ color: BRAND_ACCENT, fontWeight: 'bold' }}>
            ★ {review.deliveryRating}.0
          </Text>
        </View>
      ) : null}

      {/* COMMENT TEXT */}
      {review.comment ? (
        <Text variant="body" style={{ color: tokens.color.textPrimary, marginTop: 4, lineHeight: 20 }}>
          "{review.comment}"
        </Text>
      ) : (
        <Text variant="caption" color={tokens.color.textSecondary} style={{ fontStyle: 'italic', marginTop: 2 }}>
          No written comment provided with this rating.
        </Text>
      )}

      {/* BOTTOM FOOTER LINK */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginTop: tokens.spacing.xs,
          paddingTop: tokens.spacing.xs,
          borderTopWidth: 1,
          borderTopColor: tokens.color.border,
        }}
      >
        <Text variant="caption" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
          View Details →
        </Text>
      </View>
    </Pressable>
  );
}
