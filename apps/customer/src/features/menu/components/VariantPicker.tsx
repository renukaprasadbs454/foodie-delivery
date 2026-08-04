import React from 'react';
import { Pressable, View } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';
import type { MenuVariant } from '../types';
import { formatMoney, parseMoney } from '../types';

type Props = {
  variants: MenuVariant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
  basePrice: number | string;
};

/** UI-API VariantPicker — P2-CUS-02. */
export function VariantPicker({
  variants,
  selectedVariantId,
  onSelect,
  basePrice,
}: Props) {
  const { tokens } = useTheme();
  const base = parseMoney(basePrice);

  return (
    <View style={{ gap: tokens.spacing.sm }}>
      <Text variant="label">Variant</Text>
      {variants.map((variant) => {
        const selected = selectedVariantId === variant.variantId;
        const price = base + parseMoney(variant.priceDelta);
        return (
          <Pressable
            key={variant.variantId}
            onPress={() => {
              onSelect(variant.variantId);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Variant ${variant.name}`}
            style={{
              padding: tokens.spacing.md,
              borderRadius: tokens.radius.md,
              borderWidth: 1,
              borderColor: selected ? tokens.color.accent : tokens.color.border,
              backgroundColor: selected
                ? tokens.color.surface
                : tokens.color.background,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <Text variant="body">{variant.name}</Text>
            <Text variant="label">₹{formatMoney(price)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
