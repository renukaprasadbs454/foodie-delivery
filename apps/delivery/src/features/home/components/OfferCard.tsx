import React from 'react';
import { View } from 'react-native';
import { Button, Text, useTheme } from 'foodie-shared-rn';
import type { DeliveryOffer } from '../types';
import { formatDistanceKm } from '../types';

type Props = {
  offer: DeliveryOffer;
  accepting: boolean;
  acceptDisabled: boolean;
  onAccept: () => void;
};

/** Offer row — UI-API OfferCard. Accept only (no decline — GAP-API-10). */
export function OfferCard({
  offer,
  accepting,
  acceptDisabled,
  onAccept,
}: Props) {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        padding: tokens.spacing.md,
        borderWidth: 1,
        borderColor: tokens.color.border,
        borderRadius: tokens.radius.sm,
        backgroundColor: tokens.color.surface,
        gap: tokens.spacing.sm,
      }}
      accessibilityLabel={`Offer from ${offer.restaurantName}`}
    >
      <Text variant="heading3">{offer.restaurantName}</Text>
      <Text variant="body" color={tokens.color.textSecondary}>
        {offer.pickupAddress}
      </Text>
      <Text variant="caption" color={tokens.color.textSecondary}>
        Distance {formatDistanceKm(offer.estimatedDistance)}
      </Text>
      <Button
        label="Accept offer"
        accessibilityLabel={`Accept offer from ${offer.restaurantName}`}
        loading={accepting}
        disabled={acceptDisabled}
        onPress={onAccept}
      />
    </View>
  );
}
