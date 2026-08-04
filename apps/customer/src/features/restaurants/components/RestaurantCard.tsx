import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Text, useTheme } from 'foodie-shared-rn';
import type { RestaurantSummary } from '../types';

type Props = {
  restaurant: RestaurantSummary;
  onPress: () => void;
};

/** UI-API reusable RestaurantCard — P2-CUS-01. */
export function RestaurantCard({ restaurant, onPress }: Props) {
  const { tokens } = useTheme();
  const cuisine = restaurant.cuisineTypes?.slice(0, 2).join(' · ');
  const rating =
    restaurant.avgRating !== null && restaurant.avgRating !== undefined
      ? restaurant.avgRating.toFixed(1)
      : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Restaurant ${restaurant.name}`}
      style={{
        backgroundColor: tokens.color.surface,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: tokens.color.border,
        padding: tokens.spacing.md,
        gap: tokens.spacing.sm,
      }}
    >
      <Text variant="heading3">{restaurant.name}</Text>
      {cuisine ? (
        <Text variant="bodySmall" color={tokens.color.textSecondary}>
          {cuisine}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: tokens.spacing.sm, flexWrap: 'wrap' }}>
        {rating ? (
          <Badge
            label={`★ ${rating}`}
            tone="accent"
            accessibilityLabel={`Rating ${rating}`}
          />
        ) : null}
        {restaurant.city ? (
          <Badge
            label={restaurant.city}
            tone="neutral"
            accessibilityLabel={`City ${restaurant.city}`}
          />
        ) : null}
      </View>
      {restaurant.description ? (
        <Text
          variant="caption"
          color={tokens.color.textSecondary}
          numberOfLines={2}
        >
          {restaurant.description}
        </Text>
      ) : null}
    </Pressable>
  );
}
