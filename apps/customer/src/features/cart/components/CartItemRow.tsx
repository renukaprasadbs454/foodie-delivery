import React from 'react';
import { View } from 'react-native';
import { Button, Text, useTheme } from 'foodie-shared-rn';
import type { CartItem } from '../../menu/types';
import { formatMoney } from '../../menu/types';

type Props = {
  item: CartItem;
  onRemove: () => void;
  removeDisabled?: boolean;
  removeLoading?: boolean;
};

/** UI-API CartItemRow — P2-CUS-03. */
export function CartItemRow({
  item,
  onRemove,
  removeDisabled,
  removeLoading,
}: Props) {
  const { tokens } = useTheme();

  return (
    <View
      style={{
        paddingVertical: tokens.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: tokens.color.border,
        gap: tokens.spacing.sm,
      }}
      accessibilityLabel={`Cart line quantity ${item.quantity}`}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: tokens.spacing.md,
        }}
      >
        <Text variant="heading3" style={{ flex: 1 }}>
          Item · qty {item.quantity}
        </Text>
        <Text variant="label">₹{formatMoney(item.lineTotal)}</Text>
      </View>
      <Text variant="bodySmall" color={tokens.color.textSecondary}>
        ₹{formatMoney(item.unitPrice)} each
        {item.variantId ? ' · variant selected' : ''}
      </Text>
      {item.notes ? (
        <Text variant="caption" color={tokens.color.textSecondary}>
          Notes: {item.notes}
        </Text>
      ) : null}
      <Button
        label="Remove"
        accessibilityLabel="Remove cart item"
        variant="danger"
        disabled={removeDisabled}
        loading={removeLoading}
        onPress={onRemove}
      />
    </View>
  );
}
