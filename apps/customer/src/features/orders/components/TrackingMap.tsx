import React from 'react';
import { View } from 'react-native';
import { Text, useTheme, type WebSocketLocation } from 'foodie-shared-rn';

type Props = {
  location: WebSocketLocation | null;
  orderStatus: string;
};

/**
 * Map shell — full map via P2-XAP-04. Shows last known courier coords when present.
 */
export function TrackingMap({ location, orderStatus }: Props) {
  const { tokens } = useTheme();

  return (
    <View
      style={{
        minHeight: 160,
        padding: tokens.spacing.md,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: tokens.color.border,
        backgroundColor: tokens.color.surface,
        justifyContent: 'center',
        gap: tokens.spacing.sm,
      }}
      accessibilityLabel="Delivery location map placeholder"
    >
      <Text variant="label">Live location</Text>
      {location ? (
        <>
          <Text variant="body">
            Lat {location.lat.toFixed(5)}, Lng {location.lng.toFixed(5)}
          </Text>
          <Text variant="caption" color={tokens.color.textSecondary}>
            Updated {new Date(location.timestamp).toLocaleTimeString()} · status{' '}
            {orderStatus}
          </Text>
        </>
      ) : (
        <Text variant="body" color={tokens.color.textSecondary}>
          Waiting for courier location. Map rendering lands with P2-XAP-04.
        </Text>
      )}
    </View>
  );
}
