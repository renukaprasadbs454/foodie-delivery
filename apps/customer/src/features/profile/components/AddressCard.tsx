import React from 'react';
import { View } from 'react-native';
import { Button, Text, useTheme } from 'foodie-shared-rn';
import type { CustomerAddress } from '../../checkout/types';

type Props = {
  address: CustomerAddress;
  onRemove: () => void;
  onSelect?: () => void;
  selectMode?: boolean;
  removing?: boolean;
};

/** Address list card — UI-API AddressCard. No in-place edit (Gap). */
export function AddressCard({
  address,
  onRemove,
  onSelect,
  selectMode,
  removing,
}: Props) {
  const { tokens } = useTheme();

  return (
    <View
      style={{
        padding: tokens.spacing.md,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: tokens.color.border,
        backgroundColor: tokens.color.surface,
        gap: tokens.spacing.sm,
      }}
      accessibilityLabel={`Address ${address.label ?? address.line1}`}
    >
      <Text variant="label">
        {address.label?.trim() || 'Address'}
        {address.isDefault ? ' · Default' : ''}
      </Text>
      <Text variant="body">{address.line1}</Text>
      {address.line2 ? <Text variant="body">{address.line2}</Text> : null}
      <Text variant="caption" color={tokens.color.textSecondary}>
        {address.city} · {address.pincode}
      </Text>
      <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
        {selectMode && onSelect ? (
          <Button
            label="Use this address"
            accessibilityLabel="Use this address"
            onPress={onSelect}
          />
        ) : null}
        <Button
          label="Remove"
          accessibilityLabel="Remove address"
          variant="secondary"
          loading={removing}
          onPress={onRemove}
        />
      </View>
    </View>
  );
}
