import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';
import type { RestaurantReview } from '../types';

type Props = {
  review: RestaurantReview;
};

/** Public review row — no customer identity (API §12.2). */
export function ReviewListItem({ review }: Props) {
  const { tokens } = useTheme();

  return (
    <View
      style={{
        padding: tokens.spacing.md,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: tokens.color.border,
        backgroundColor: tokens.color.surface,
        gap: tokens.spacing.xs,
      }}
      accessibilityLabel={`Review ${review.restaurantRating} stars`}
    >
      <Text variant="label">★ {review.restaurantRating}</Text>
      {review.deliveryRating != null ? (
        <Text variant="caption" color={tokens.color.textSecondary}>
          Delivery ★ {review.deliveryRating}
        </Text>
      ) : null}
      {review.comment ? <Text variant="body">{review.comment}</Text> : null}
      {review.createdAt ? (
        <Text variant="caption" color={tokens.color.textSecondary}>
          {new Date(review.createdAt).toLocaleDateString()}
        </Text>
      ) : null}
    </View>
  );
}
