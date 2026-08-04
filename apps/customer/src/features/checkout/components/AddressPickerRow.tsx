import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Text, useTheme } from 'foodie-shared-rn';
import type { CustomerAddress } from '../types';

type Props = {
  address: CustomerAddress;
  selected: boolean;
  onSelect: () => void;
};

/** UI-API AddressPickerRow — P2-CUS-04. */
export function AddressPickerRow({ address, selected, onSelect }: Props) {
  const { tokens } = useTheme();
  const title = address.label?.trim() || address.line1;

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`Address ${title}`}
      style={{
        padding: tokens.spacing.md,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: selected ? tokens.color.accent : tokens.color.border,
        backgroundColor: tokens.color.surface,
        gap: tokens.spacing.xs,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          gap: tokens.spacing.sm,
        }}
      >
        <Text variant="label" style={{ flex: 1 }}>
          {title}
        </Text>
        {address.isDefault ? (
          <Badge
            label="Default"
            tone="accent"
            accessibilityLabel="Default address"
          />
        ) : null}
      </View>
      <Text variant="bodySmall" color={tokens.color.textSecondary}>
        {[address.line1, address.line2, address.city, address.pincode]
          .filter(Boolean)
          .join(', ')}
      </Text>
    </Pressable>
  );
}
