import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Text, useTheme } from 'foodie-shared-rn';
import type { MenuItem } from '../types';
import { formatMoney } from '../types';

type Props = {
  item: MenuItem;
  onPress: () => void;
};

/** UI-API MenuItemRow — unavailable items remain visible greyed (§4.1). */
export function MenuItemRow({ item, onPress }: Props) {
  const { tokens } = useTheme();
  const disabled = !item.isAvailable;
  const primary = disabled
    ? tokens.color.textSecondary
    : tokens.color.textPrimary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={`${item.name}${disabled ? ', unavailable' : ''}`}
      style={{
        paddingVertical: tokens.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: tokens.color.border,
        opacity: disabled ? 0.55 : 1,
        gap: tokens.spacing.xs,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: tokens.spacing.md,
        }}
      >
        <Text variant="heading3" color={primary} style={{ flex: 1 }}>
          {item.name}
        </Text>
        <Text variant="label" color={primary}>
          ₹{formatMoney(item.basePrice)}
        </Text>
      </View>
      {item.description ? (
        <Text variant="bodySmall" color={tokens.color.textSecondary} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: tokens.spacing.sm, flexWrap: 'wrap' }}>
        <Badge
          label={item.isVeg ? 'Veg' : 'Non-veg'}
          tone={item.isVeg ? 'success' : 'neutral'}
          accessibilityLabel={item.isVeg ? 'Vegetarian' : 'Non vegetarian'}
        />
        {disabled ? (
          <Badge
            label="Unavailable"
            tone="warning"
            accessibilityLabel="Item unavailable"
          />
        ) : null}
      </View>
    </Pressable>
  );
}
