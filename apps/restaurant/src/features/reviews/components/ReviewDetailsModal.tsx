import React from 'react';
import { View } from 'react-native';
import { Button, Card, Modal, Text, useTheme } from 'foodie-shared-rn';
import type { RestaurantReview } from '../types';

type Props = {
  review: RestaurantReview | null;
  visible: boolean;
  onClose: () => void;
};

const BRAND_PRIMARY = '#14532D'; // Dark Green
const BRAND_ACCENT = '#F59E0B';  // Gold

export function ReviewDetailsModal({ review, visible, onClose }: Props) {
  const { tokens } = useTheme();

  if (!review) return null;

  const rating = Number(review.restaurantRating) || 5;
  const starsString = '★'.repeat(Math.min(5, Math.max(1, Math.round(rating))));

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      title="Customer Review Details"
      accessibilityLabel="Customer Review Details Modal"
    >
      <View style={{ gap: tokens.spacing.md }}>
        {/* HEADER BADGE */}
        <Card
          style={{
            padding: tokens.spacing.md,
            borderRadius: 14,
            gap: tokens.spacing.xs,
            borderLeftWidth: 4,
            borderLeftColor: BRAND_PRIMARY,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ gap: 2 }}>
              <Text variant="heading2" style={{ color: BRAND_PRIMARY, fontSize: 18 }}>
                Verified Customer
              </Text>
              <Text variant="caption" color={tokens.color.textSecondary}>
                📅 {review.createdAt ? new Date(review.createdAt).toLocaleString() : 'Recent Rating'}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <Text style={{ color: BRAND_ACCENT, fontSize: 20 }}>{starsString}</Text>
              <Text variant="label" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
                {rating}.0 Rating
              </Text>
            </View>
          </View>
        </Card>

        {/* DETAILED RATINGS BREAKDOWN */}
        <Card style={{ padding: tokens.spacing.md, borderRadius: 14, gap: tokens.spacing.xs }}>
          <Text variant="label" style={{ color: BRAND_PRIMARY, fontSize: 15, fontWeight: 'bold' }}>
            Category Rating Breakdown
          </Text>
          <View style={{ height: 1, backgroundColor: tokens.color.border, marginVertical: 4 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="body" color={tokens.color.textSecondary}>Food & Restaurant Quality</Text>
            <Text variant="body" style={{ color: BRAND_ACCENT, fontWeight: 'bold' }}>
              ★ {rating}.0 / 5.0
            </Text>
          </View>

          {review.deliveryRating != null ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="body" color={tokens.color.textSecondary}>Delivery & Packaging Service</Text>
              <Text variant="body" style={{ color: BRAND_ACCENT, fontWeight: 'bold' }}>
                ★ {review.deliveryRating}.0 / 5.0
              </Text>
            </View>
          ) : null}
        </Card>

        {/* COMMENT TEXT CARD */}
        <Card style={{ padding: tokens.spacing.md, borderRadius: 14, gap: tokens.spacing.xs }}>
          <Text variant="label" style={{ color: BRAND_PRIMARY, fontSize: 15, fontWeight: 'bold' }}>
            Customer Feedback & Comment
          </Text>
          <View style={{ height: 1, backgroundColor: tokens.color.border, marginVertical: 4 }} />

          {review.comment ? (
            <Text variant="body" style={{ color: tokens.color.textPrimary, lineHeight: 22 }}>
              "{review.comment}"
            </Text>
          ) : (
            <Text variant="caption" color={tokens.color.textSecondary} style={{ fontStyle: 'italic' }}>
              No written comment was provided for this rating.
            </Text>
          )}
        </Card>

        <Button
          label="Close Details"
          accessibilityLabel="Close review details"
          variant="secondary"
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}
