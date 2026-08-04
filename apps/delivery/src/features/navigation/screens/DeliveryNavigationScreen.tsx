import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Text,
  Toast,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetOrderQuery } from '../../../api/endpoints/ordersApi';
import { useAssignmentOrderSubscription } from '../../home/hooks/useAssignmentOrderSubscription';
import { isUuid } from '../../home/types';
import { MapSkeleton } from '../components/MapSkeleton';
import { TrackingMap } from '../components/TrackingMap';
import { useLocationPingLoop } from '../hooks/useLocationPingLoop';
import { openOsMapsHandoff } from '../osMaps';
import { isNavigationLeg } from '../types';
import type { MainStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'DeliveryNavigation'>;

/**
 * P2-DEL-03 — situational map + OS maps handoff + location ping (1/3s).
 * No in-app turn-by-turn. Order DTO has no lat/lng — OS handoff Partial without inventing coords.
 */
export function DeliveryNavigationScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const { orderId, assignmentId, leg: rawLeg } = route.params;
  const leg = isNavigationLeg(rawLeg) ? rawLeg : 'pickup';
  const validOrder = Boolean(orderId && isUuid(orderId));

  const orderQuery = useGetOrderQuery(orderId, {
    skip: !validOrder,
    pollingInterval: 30_000,
    refetchOnFocus: true,
  });

  useAssignmentOrderSubscription(
    validOrder ? orderId : undefined,
    orderQuery.data?.status,
  );

  const status = orderQuery.data?.status;
  const pingEnabled =
    status === 'OUT_FOR_DELIVERY' ||
    status === 'PICKED_UP' ||
    status === 'ACCEPTED';

  const { lastPing, permissionDenied } = useLocationPingLoop({
    enabled: pingEnabled && validOrder,
  });

  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  useEffect(() => {
    trackAnalyticsEvent('delivery_navigation_viewed', { leg });
  }, [leg]);

  const onOpenOsMaps = async () => {
    trackAnalyticsEvent('open_os_maps_tapped', { leg, orderId });
    const opened = await openOsMapsHandoff({
      latitude: lastPing?.latitude,
      longitude: lastPing?.longitude,
      query: orderQuery.data?.orderNumber
        ? `Order ${orderQuery.data.orderNumber}`
        : undefined,
    });
    if (!opened) {
      setToast({
        message: 'Could not open OS maps on this device.',
        variant: 'warning',
      });
      return;
    }
    if (!lastPing) {
      setToast({
        message:
          'Opened OS maps. Pickup/drop coordinates are not on the order DTO — navigate using the address from your assignment.',
        variant: 'info',
      });
    }
  };

  if (!validOrder) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.color.background,
          padding: tokens.spacing.xl,
          justifyContent: 'center',
        }}
      >
        <Text variant="body">Invalid navigation parameters.</Text>
      </View>
    );
  }

  const loading = orderQuery.isLoading && !orderQuery.data;

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 48,
        }}
      >
        <Text variant="heading1" accessibilityRole="header">
          Navigation
        </Text>
        <Text variant="body" color={tokens.color.textSecondary}>
          Order {orderQuery.data?.orderNumber ?? orderId} ·{' '}
          {status ?? 'loading'} · {leg} leg
        </Text>
        {!isConnected ? (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — location pings buffered (last 2–3); most recent flushes on
            reconnect.
          </Text>
        ) : null}
        {permissionDenied ? (
          <Text variant="caption" color={tokens.color.error}>
            Location permission denied — cannot publish location pings.
          </Text>
        ) : null}
        {loading ? <MapSkeleton /> : (
          <TrackingMap
            lastPing={lastPing}
            orderStatus={status}
            leg={leg}
          />
        )}
        <Button
          label="Open OS maps"
          accessibilityLabel="Open OS maps for turn by turn"
          onPress={() => {
            void onOpenOsMaps();
          }}
          style={{ minHeight: 48 }}
        />
        {leg === 'pickup' ? (
          <Button
            label="Enter pickup OTP"
            accessibilityLabel="Enter pickup OTP"
            variant="secondary"
            onPress={() =>
              navigation.navigate('PickupOtp', { assignmentId, orderId })
            }
            style={{ minHeight: 48 }}
          />
        ) : (
          <Button
            label="Enter delivery OTP"
            accessibilityLabel="Enter delivery OTP"
            variant="secondary"
            onPress={() =>
              navigation.navigate('DeliveryOtp', { assignmentId, orderId })
            }
            style={{ minHeight: 48 }}
          />
        )}
        <Button
          label="Assignment details"
          accessibilityLabel="Back to assignment details"
          variant="secondary"
          onPress={() =>
            navigation.navigate('AssignmentDetails', {
              assignmentId,
              orderId,
            })
          }
          style={{ minHeight: 48 }}
        />
      </ScrollView>
      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast'}
        onDismiss={() => setToast(null)}
      />
    </View>
  );
}
