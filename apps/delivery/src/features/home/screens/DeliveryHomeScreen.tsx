import React, { useEffect } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  Text,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetDeliveryOffersQuery } from '../../../api/endpoints/deliveryApi';
import { useGetOrderQuery } from '../../../api/endpoints/ordersApi';
import { useAppSelector } from '../../../store/hooks';
import {
  selectActiveAssignment,
  selectIsOnline,
} from '../availabilitySlice';
import { DeliveryHomeSkeleton } from '../components/DeliveryHomeSkeleton';
import { useAssignmentOrderSubscription } from '../hooks/useAssignmentOrderSubscription';
import { formatMoney } from '../types';
import type { MainStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'DeliveryHome'>;

/**
 * P2-DEL-02 — primary Home: availability entry + offers/assignment summary.
 * Shallow Home+modals nav (no tabs).
 */
export function DeliveryHomeScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const isOnline = useAppSelector(selectIsOnline);
  const active = useAppSelector(selectActiveAssignment);

  const offersQuery = useGetDeliveryOffersQuery(undefined, {
    pollingInterval: 20_000,
    refetchOnFocus: true,
  });

  const orderQuery = useGetOrderQuery(active?.orderId ?? '', {
    skip: !active?.orderId,
    pollingInterval: active?.orderId ? 30_000 : 0,
    refetchOnFocus: true,
  });

  useAssignmentOrderSubscription(active?.orderId, orderQuery.data?.status);

  useEffect(() => {
    trackAnalyticsEvent('delivery_home_viewed');
    trackAnalyticsEvent('delivery_home_loaded');
  }, []);

  const offers = offersQuery.data ?? [];
  const loading =
    (offersQuery.isLoading && !offersQuery.data) ||
    (Boolean(active?.orderId) && orderQuery.isLoading && !orderQuery.data);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 48,
        }}
        refreshControl={
          <RefreshControl
            refreshing={offersQuery.isFetching || orderQuery.isFetching}
            onRefresh={() => {
              void offersQuery.refetch();
              if (active?.orderId) void orderQuery.refetch();
            }}
          />
        }
      >
        <Text variant="heading1" accessibilityRole="header">
          Home
        </Text>
        <Text variant="body" color={tokens.color.textSecondary}>
          {isOnline ? 'Online' : 'Offline'}
          {!isConnected ? ' · device offline' : ''}
        </Text>

        {loading ? <DeliveryHomeSkeleton /> : null}

        <Button
          label="Availability"
          accessibilityLabel="Open availability"
          onPress={() => navigation.navigate('Availability')}
        />
        <Button
          label={`Offers (${offers.length})`}
          accessibilityLabel="Open delivery offers"
          variant="secondary"
          onPress={() => {
            trackAnalyticsEvent('open_offers_tapped');
            navigation.navigate('DeliveryOffers');
          }}
        />

        {active?.orderId ? (
          <View
            style={{
              padding: tokens.spacing.md,
              borderWidth: 1,
              borderColor: tokens.color.border,
              borderRadius: tokens.radius.sm,
              backgroundColor: tokens.color.surface,
              gap: tokens.spacing.sm,
            }}
          >
            <Text variant="heading3">Current assignment</Text>
            <Text variant="body">
              {orderQuery.data
                ? `Order ${orderQuery.data.orderNumber} · ${orderQuery.data.status}`
                : `Order ${active.orderId}`}
            </Text>
            {orderQuery.data ? (
              <Text variant="caption" color={tokens.color.textSecondary}>
                Total {formatMoney(orderQuery.data.totalAmount)}
              </Text>
            ) : null}
            <Button
              label="Open assignment"
              accessibilityLabel="Open assignment details"
              onPress={() => {
                trackAnalyticsEvent('open_assignment_tapped', {
                  orderId: active.orderId,
                });
                navigation.navigate('AssignmentDetails', {
                  assignmentId: active.assignmentId,
                  orderId: active.orderId,
                });
              }}
            />
          </View>
        ) : !loading && isOnline && offers.length === 0 ? (
          <EmptyState
            title="Waiting for offers"
            description="You are online with no open offers. Pull to refresh."
            accessibilityLabel="Waiting for offers"
          />
        ) : null}

        <Button
          label="Wallet"
          accessibilityLabel="Open wallet"
          variant="secondary"
          onPress={() => navigation.navigate('Wallet')}
        />
        <Button
          label="Notifications"
          accessibilityLabel="Open notifications"
          variant="secondary"
          onPress={() => navigation.navigate('DeliveryNotifications')}
        />
        <Button
          label="Profile"
          accessibilityLabel="Open profile"
          variant="secondary"
          onPress={() => navigation.navigate('DeliveryProfile')}
        />
      </ScrollView>
    </View>
  );
}
