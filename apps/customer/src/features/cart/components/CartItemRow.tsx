import React from 'react';
import { View, Pressable, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';
import type { CartItem } from '../../menu/types';
import { formatMoney } from '../../menu/types';

type Props = {
  item: CartItem;
  name?: string;
  isVeg?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  loading?: boolean;
};

export function CartItemRow({
  item,
  name,
  isVeg = true, // default or based on lookup
  onIncrement,
  onDecrement,
  loading,
}: Props) {
  const { tokens } = useTheme();

  return (
    <View
      style={{
        padding: tokens.spacing.md,
        marginBottom: tokens.spacing.sm,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e4e4e7',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
        gap: tokens.spacing.xs,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
      accessibilityLabel={`Cart line quantity ${item.quantity}`}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm }}>
          <View style={{
            width: 14,
            height: 14,
            borderWidth: 1.5,
            borderColor: isVeg ? '#15803d' : '#b91c1c',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 2,
          }}>
            <View style={{
              width: 6,
              height: 6,
              borderRadius: tokens.radius.full,
              backgroundColor: isVeg ? '#15803d' : '#b91c1c',
            }} />
          </View>
          <Text variant="heading3" style={{ fontWeight: '800', color: '#27272a', fontSize: 16, flexShrink: 1, paddingRight: 8 }}>
            {name || 'Unknown Item'}
          </Text>
        </View>

        {item.variantId ? (
          <Text variant="caption" color={tokens.color.textSecondary} style={{ fontWeight: '500', marginTop: 4 }}>
            Custom Variant
          </Text>
        ) : null}

        {item.notes ? (
          <Text variant="caption" color={tokens.color.textSecondary} style={{ fontStyle: 'italic', marginTop: 2 }}>
            Notes: "{item.notes}"
          </Text>
        ) : null}
      </View>

      <View style={{ alignItems: 'flex-end', gap: tokens.spacing.sm }}>
        {loading ? (
          <View style={{ width: 76, height: 32, justifyContent: 'center' }}>
            <ActivityIndicator size="small" color={tokens.color.accent} />
          </View>
        ) : (
          <View style={{
            flexDirection: 'row',
            backgroundColor: '#14532D10', // Very subtle green on light background
            borderWidth: 1.5,
            borderColor: '#14532D', // Dark Green
            borderRadius: 10,
            width: 90,
            height: 34,
            justifyContent: 'space-between',
            alignItems: 'center',
            overflow: 'hidden'
          }}>
            <Pressable onPress={onDecrement} style={{ paddingHorizontal: 12, height: '100%', justifyContent: 'center' }}>
              <Text style={{ color: '#14532D', fontWeight: '900', fontSize: 16 }}>-</Text>
            </Pressable>
            <Text style={{ color: '#14532D', fontWeight: '900', fontSize: 15 }}>{item.quantity}</Text>
            <Pressable onPress={onIncrement} style={{ paddingHorizontal: 12, height: '100%', justifyContent: 'center' }}>
              <Text style={{ color: '#14532D', fontWeight: '900', fontSize: 16 }}>+</Text>
            </Pressable>
          </View>
        )}

        <Text variant="label" style={{ fontWeight: '900', color: '#18181b', fontSize: 15, marginTop: 4 }}>
          ₹{formatMoney(item.lineTotal)}
        </Text>
      </View>
    </View>
  );
}

