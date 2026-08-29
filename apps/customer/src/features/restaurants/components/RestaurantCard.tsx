import React from 'react';
import { Pressable, View, Image } from 'react-native';
import { Badge, Text, useTheme } from 'foodie-shared-rn';
import type { RestaurantSummary } from '../types';

type Props = {
  restaurant: RestaurantSummary;
  onPress: () => void;
  columnMode?: boolean;
};

// Curated high-resolution Unsplash food images for fallback hashing
const FALLBACK_FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600', // Burger & Fries
  'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600', // Pizza
  'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=600', // Bowls / Curries
  'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600', // Specialty Dessert
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600', // Salad
];

function getRestaurantImage(restaurant: RestaurantSummary): string {
  if (restaurant.imageUrl && restaurant.imageUrl.startsWith('http')) return restaurant.imageUrl;
  // Dynamic fallback based on name hashing
  let hash = 0;
  const name = restaurant.name || '';
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_FOOD_IMAGES.length;
  return FALLBACK_FOOD_IMAGES[index]!;
}

export function RestaurantCard({ restaurant, onPress, columnMode }: Props) {
  const { tokens } = useTheme();
  const cuisine = restaurant.cuisineTypes?.slice(0, columnMode ? 1 : 2).join(' · ');
  const rating =
    restaurant.avgRating !== null && restaurant.avgRating !== undefined
      ? restaurant.avgRating.toFixed(1)
      : null;

  const imageUrl = getRestaurantImage(restaurant);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Restaurant ${restaurant.name}`}
      style={({ pressed }) => ({
        backgroundColor: tokens.color.surface,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: tokens.color.border,
        overflow: 'hidden',
        shadowColor: '#14532D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: pressed ? 0.08 : 0.04,
        shadowRadius: 8,
        elevation: pressed ? 4 : 2,
        marginBottom: tokens.spacing.sm,
        opacity: pressed ? 0.95 : 1,
        flex: columnMode ? 1 : undefined,
        marginHorizontal: columnMode ? 4 : 0,
      })}
    >
      {/* Cover Image */}
      <View style={{ height: columnMode ? 110 : 150, width: '100%', backgroundColor: '#F0ECE4' }}>
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
        {restaurant.city && !columnMode ? (
          <View style={{
            position: 'absolute',
            top: tokens.spacing.sm,
            right: tokens.spacing.sm,
            backgroundColor: 'rgba(255,255,255,0.92)',
            borderRadius: tokens.radius.sm,
            paddingHorizontal: tokens.spacing.sm,
            paddingVertical: 2,
          }}>
            <Text variant="caption" style={{ fontWeight: '700', color: tokens.color.accent }}>
              {restaurant.city.toUpperCase()}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Info details */}
      <View style={{ padding: columnMode ? tokens.spacing.sm : tokens.spacing.md, gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text
            variant={columnMode ? "label" : "heading3"}
            numberOfLines={1}
            style={{ flex: 1, fontWeight: '700', color: tokens.color.textPrimary, fontSize: columnMode ? 13 : 16 }}
          >
            {restaurant.name}
          </Text>
          {rating ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#14532D', // Dark Green
              paddingHorizontal: columnMode ? 5 : 8,
              paddingVertical: columnMode ? 2 : 3,
              borderRadius: tokens.radius.sm,
              marginLeft: 4,
            }}>
              <Text style={{ color: '#FCD34D', fontWeight: 'bold', fontSize: columnMode ? 10 : 13, marginRight: 2 }}>★</Text>
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: columnMode ? 10 : 12 }}>
                {rating}
              </Text>
            </View>
          ) : null}
        </View>

        {cuisine ? (
          <Text variant="caption" color={tokens.color.textSecondary} numberOfLines={1} style={{ fontWeight: '500', fontSize: 11 }}>
            {cuisine}
          </Text>
        ) : null}

        {restaurant.description && !columnMode ? (
          <Text
            variant="caption"
            color={tokens.color.textSecondary}
            numberOfLines={2}
            style={{ marginTop: tokens.spacing.xs, lineHeight: 16 }}
          >
            {restaurant.description}
          </Text>
        ) : null}

        {/* Mock ETA */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: columnMode ? 2 : 4 }}>
          <Text style={{ fontSize: columnMode ? 11 : 13 }}>⏱️</Text>
          <Text style={{ fontSize: columnMode ? 11 : 13, color: '#14532D', fontWeight: '700' }}>
            {20 + (Math.abs(restaurant.name.length * 7) % 25)}m
          </Text>
          <Text style={{ color: '#D1D5DB', fontSize: columnMode ? 9 : 10, marginHorizontal: columnMode ? 1 : 4 }}>|</Text>
          <Text style={{ fontSize: columnMode ? 11 : 13, color: '#6B7280', fontWeight: '600' }}>
            {(2.5 + (restaurant.name.length % 3)).toFixed(1)} km
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

