import React from 'react';
import { View } from 'react-native';
import { Text } from 'foodie-shared-rn';
import type { RestaurantReview } from '../../restaurants/types';
import { FontAwesome } from '@expo/vector-icons';

type Props = {
  review: RestaurantReview;
};

export function ReviewListItem({ review }: Props) {
  const rating = Number(review.restaurantRating) || 5;

  return (
    <View
      style={{
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        gap: 8,
        shadowColor: '#14532D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
      }}
      accessibilityLabel={`Review ${review.restaurantRating} stars`}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <FontAwesome
              key={star}
              name={star <= rating ? 'star' : 'star-o'}
              size={18}
              color={star <= rating ? '#FCD34D' : '#9CA3AF'}
            />
          ))}
        </View>
        {review.createdAt ? (
          <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '600' }}>
            {new Date(review.createdAt).toLocaleDateString()}
          </Text>
        ) : null}
      </View>

      {review.deliveryRating != null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 13, color: '#4B5563', fontWeight: '600' }}>Delivery Service:</Text>
          <View style={{ flexDirection: 'row', gap: 2 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FontAwesome
                key={star}
                name={star <= (review.deliveryRating || 0) ? 'star' : 'star-o'}
                size={12}
                color={star <= (review.deliveryRating || 0) ? '#FCD34D' : '#9CA3AF'}
              />
            ))}
          </View>
        </View>
      )}

      {review.comment ? (
        <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600', marginTop: 4, lineHeight: 20 }}>
          "{review.comment}"
        </Text>
      ) : null}
    </View>
  );
}
