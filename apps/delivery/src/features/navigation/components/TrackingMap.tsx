import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';
import type { LocationPingPayload } from '../types';
import type { NavigationLeg } from '../types';

type Props = {
  lastPing: LocationPingPayload | null;
  orderStatus: string | undefined;
  leg: NavigationLeg;
};

/**
 * Situational map shell — full map via P2-XAP-04 (customer TrackingMap pattern).
 * Turn-by-turn remains OS maps handoff (SD §16.3).
 */
export function TrackingMap({ lastPing, orderStatus, leg }: Props) {
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
      accessibilityLabel="Delivery navigation map placeholder"
    >
      <Text variant="label">
        Situational map · {leg === 'pickup' ? 'Pickup leg' : 'Drop leg'}
      </Text>
      {lastPing ? (
        <>
          <Text variant="body">
            Lat {lastPing.latitude.toFixed(5)}, Lng{' '}
            {lastPing.longitude.toFixed(5)}
          </Text>
          <Text variant="caption" color={tokens.color.textSecondary}>
            Last ping · status {orderStatus ?? '—'}
          </Text>
        </>
      ) : (
        <Text variant="body" color={tokens.color.textSecondary}>
          Waiting for device location. In-app map rendering lands with
          P2-XAP-04. Use OS maps for turn-by-turn.
        </Text>
      )}
    </View>
  );
}
