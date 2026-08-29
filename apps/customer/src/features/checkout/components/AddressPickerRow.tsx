import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Text, useTheme } from 'foodie-shared-rn';
import type { CustomerAddress } from '../types';

type Props = {
  address: CustomerAddress;
  selected: boolean;
  onSelect: () => void;
};

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
        flexDirection: 'row',
        alignItems: 'center',
        padding: tokens.spacing.md,
        borderRadius: tokens.radius.lg,
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? tokens.color.accent : tokens.color.border,
        backgroundColor: tokens.color.surface,
        gap: tokens.spacing.md,
        shadowColor: '#14532D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: selected ? 0.05 : 0.02,
        shadowRadius: 4,
        elevation: selected ? 3 : 1,
      }}
    >
      {/* Branded Left Side Radio Indicator */}
      <View style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: selected ? tokens.color.accent : tokens.color.border,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {selected ? (
          <View style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: tokens.color.accent, // Brand Green dot
          }} />
        ) : null}
      </View>

      {/* Address Details on Right Side */}
      <View style={{ flex: 1, gap: 2 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: tokens.spacing.sm,
          }}
        >
          <Text variant="label" style={{ fontWeight: '700', color: tokens.color.textPrimary }}>
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
        <Text variant="caption" color={tokens.color.textSecondary} style={{ lineHeight: 16 }}>
          {[address.line1, address.line2, address.city, address.pincode]
            .filter(Boolean)
            .join(', ')}
        </Text>
      </View>
    </Pressable>
  );
}

