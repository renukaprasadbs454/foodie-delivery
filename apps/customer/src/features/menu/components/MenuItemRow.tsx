import React from 'react';
import { Pressable, View, Image } from 'react-native';
import { Badge, Text, useTheme } from 'foodie-shared-rn';
import type { MenuItem } from '../types';
import { formatMoney } from '../types';

type Props = {
  item: MenuItem;
  quantity?: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
};

// Curated high-resolution Unsplash food images for menu item fallbacks
const FALLBACK_DISH_IMAGES = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300', // Pasta Salad
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=300', // Pizza slice
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?q=80&w=300', // Sandwich
  'https://images.unsplash.com/photo-1484723091739-30a097e8f929?q=80&w=300', // French Toast
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=300', // Pancakes
];

function getDishImage(item: MenuItem): string {
  if (item.imageUrl && item.imageUrl.startsWith('http')) return item.imageUrl;
  // Dynamic fallback based on item id or name hashing
  let hash = 0;
  const name = item.name || '';
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_DISH_IMAGES.length;
  return FALLBACK_DISH_IMAGES[index]!;
}

export function MenuItemRow({ item, quantity = 0, onAdd, onIncrement, onDecrement }: Props) {
  const { tokens } = useTheme();
  const disabled = !item.isAvailable;
  const primary = disabled
    ? tokens.color.textSecondary
    : tokens.color.textPrimary;

  const imageUrl = getDishImage(item);

  return (
    <Pressable
      onPress={quantity > 0 ? undefined : onAdd}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={`${item.name}${disabled ? ', unavailable' : ''}`}
      style={{
        paddingVertical: tokens.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: tokens.color.border,
        opacity: disabled ? 0.6 : 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: tokens.spacing.md,
      }}
    >
      {/* Details Container on Left */}
      <View style={{ flex: 1, gap: tokens.spacing.xs }}>
        {/* Vegetarian / Non-Vegetarian Indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{
            width: 14,
            height: 14,
            borderWidth: 1.5,
            borderColor: item.isVeg ? '#15803d' : '#b91c1c',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 2,
          }}>
            <View style={{
              width: 6,
              height: 6,
              borderRadius: tokens.radius.full,
              backgroundColor: item.isVeg ? '#15803d' : '#b91c1c',
            }} />
          </View>
          {item.isVeg ? (
            <Text variant="caption" style={{ color: '#15803d', fontWeight: '600' }}>VEG</Text>
          ) : (
            <Text variant="caption" style={{ color: '#b91c1c', fontWeight: '600' }}>NON-VEG</Text>
          )}
        </View>

        <Text variant="heading3" color={primary} style={{ fontWeight: '700', marginTop: 2 }}>
          {item.name}
        </Text>

        <Text variant="label" color={primary} style={{ fontWeight: '800' }}>
          ₹{formatMoney(item.basePrice)}
        </Text>

        {item.description ? (
          <Text
            variant="caption"
            color={tokens.color.textSecondary}
            numberOfLines={2}
            style={{ marginTop: 2, lineHeight: 16 }}
          >
            {item.description}
          </Text>
        ) : null}

        {disabled ? (
          <View style={{ flexDirection: 'row', marginTop: 4 }}>
            <Badge
              label="Unavailable"
              tone="warning"
              accessibilityLabel="Item unavailable"
            />
          </View>
        ) : null}
      </View>

      {/* Styled Image & Overlap ADD button on Right */}
      <View style={{ width: 90, height: 100, justifyContent: 'center', alignItems: 'center' }}>
        <Image
          source={{ uri: imageUrl }}
          style={{
            width: 80,
            height: 80,
            borderRadius: tokens.radius.md,
            backgroundColor: '#F5EFE6',
          }}
          resizeMode="cover"
        />
        {!disabled ? (
          quantity > 0 ? (
            <View style={{
              position: 'absolute',
              bottom: -10,
              flexDirection: 'row',
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: tokens.color.accent, // Dark Green
              borderRadius: tokens.radius.sm,
              width: 76,
              height: 32,
              justifyContent: 'space-between',
              alignItems: 'center',
              shadowColor: '#14532D',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4,
            }}>
              <Pressable onPress={onDecrement} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: tokens.color.accent, fontWeight: '900', fontSize: 16 }}>-</Text>
              </Pressable>
              <Text style={{ color: tokens.color.accent, fontWeight: '900', fontSize: 14 }}>{quantity}</Text>
              <Pressable onPress={onIncrement} style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: tokens.color.accent, fontWeight: '900', fontSize: 16 }}>+</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={onAdd}
              style={({ pressed }) => ({
                position: 'absolute',
                bottom: -10,
                backgroundColor: pressed ? '#F5EFE0' : '#FFFFFF',
                borderWidth: 1,
                borderColor: tokens.color.accent, // Dark Green border
                borderRadius: tokens.radius.sm,
                width: 76,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#14532D',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 4,
              })}
            >
              <Text variant="label" color={tokens.color.accent} style={{ fontWeight: '900', fontSize: 13, letterSpacing: 0.5 }}>
                ADD
              </Text>
            </Pressable>
          )
        ) : null}
      </View>
    </Pressable>
  );
}
