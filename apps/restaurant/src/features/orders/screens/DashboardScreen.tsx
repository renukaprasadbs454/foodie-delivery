import React, { useEffect } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  Skeleton,
  Text,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetRestaurantQuery } from '../../../api/endpoints/restaurantsApi';
import { useGetRestaurantOrdersQuery } from '../../../api/endpoints/ordersApi';
import { useAppSelector } from '../../../store/hooks';
import { selectRestaurantId } from '../../onboarding/restaurantOnboardingSlice';
import { useRestaurantOrdersSubscription } from '../hooks/useRestaurantOrdersSubscription';
import type { OrdersStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<OrdersStackParamList, 'Dashboard'>;

/**
 * P2-RES-02 Dashboard — queue summary entry (Orders tab primary home).
 * No revenue analytics endpoint.
 */
export function DashboardScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const restaurantId = useAppSelector(selectRestaurantId);
  const { wsActive } = useRestaurantOrdersSubscription(restaurantId);

  const restaurantQuery = useGetRestaurantQuery(restaurantId ?? '', {
    skip: !restaurantId,
  });

  const activeQuery = useGetRestaurantOrdersQuery(
    { page: 0, size: 20, sort: 'placedAt' },
    {
      pollingInterval: wsActive ? 0 : 45_000,
      refetchOnFocus: true,
    },
  );

  const activeCount = (activeQuery.data ?? []).filter((o) =>
    ['CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(
      o.status,
    ),
  ).length;

  useEffect(() => {
    trackAnalyticsEvent('restaurant_dashboard_viewed');
    trackAnalyticsEvent('restaurant_dashboard_loaded');
  }, []);

  if (!restaurantId) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.color.background,
          padding: tokens.spacing.xl,
          justifyContent: 'center',
        }}
      >
        <EmptyState
          title="Restaurant id unavailable"
          description="Cannot load dashboard without a stored restaurant id (GAP-API-03)."
          accessibilityLabel="Restaurant id gap"
        />
      </View>
    );
  }

  const loading =
    (restaurantQuery.isLoading && !restaurantQuery.data) ||
    (activeQuery.isLoading && !activeQuery.data);

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
            refreshing={activeQuery.isFetching || restaurantQuery.isFetching}
            onRefresh={() => {
              void restaurantQuery.refetch();
              void activeQuery.refetch();
            }}
          />
        }
      >
        <Text variant="heading1" accessibilityRole="header">
          Dashboard
        </Text>
        {!isConnected ? (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — showing cached counts when available.
          </Text>
        ) : null}
        {wsActive ? (
          <Text variant="caption" color={tokens.color.textSecondary}>
            Live updates connected.
          </Text>
        ) : (
          <Text variant="caption" color={tokens.color.textSecondary}>
            Polling for new orders…
          </Text>
        )}

        {loading ? (
          <View style={{ gap: tokens.spacing.sm }}>
            <Skeleton.Block width="60%" height={24} />
            <Skeleton.Block width="40%" height={48} />
          </View>
        ) : (
          <>
            <Text variant="body" color={tokens.color.textSecondary}>
              {restaurantQuery.data?.name ?? 'Your restaurant'}
            </Text>
            <Text
              variant="heading1"
              accessibilityLabel={`${activeCount} active orders`}
            >
              {activeCount}
            </Text>
            <Text variant="caption" color={tokens.color.textSecondary}>
              Active orders in queue
            </Text>
            {activeCount === 0 ? (
              <EmptyState
                title="All caught up"
                description="No active orders right now."
                accessibilityLabel="All caught up"
              />
            ) : null}
            <Button
              label="Open order queue"
              accessibilityLabel="Open order queue"
              onPress={() => {
                trackAnalyticsEvent('open_queue_tapped');
                navigation.navigate('IncomingOrders');
              }}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}
