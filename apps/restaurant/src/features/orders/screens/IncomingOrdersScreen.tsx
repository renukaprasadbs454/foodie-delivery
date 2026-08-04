import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EmptyState,
  Text,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useAppSelector } from '../../../store/hooks';
import { selectRestaurantId } from '../../onboarding/restaurantOnboardingSlice';
import { OrderQueueItem } from '../components/OrderQueueItem';
import { OrderQueueSkeleton } from '../components/OrderQueueSkeleton';
import { useRestaurantOrdersFeed } from '../hooks/useRestaurantOrdersFeed';
import { useRestaurantOrdersSubscription } from '../hooks/useRestaurantOrdersSubscription';
import { QUEUE_STATUS_FILTERS } from '../types';
import type { OrdersStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<OrdersStackParamList, 'IncomingOrders'>;

/**
 * P2-RES-02 Incoming Orders — live queue. No restaurantId query param.
 */
export function IncomingOrdersScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const restaurantId = useAppSelector(selectRestaurantId);
  const { wsActive } = useRestaurantOrdersSubscription(restaurantId);
  const [status, setStatus] = useState('');

  const feed = useRestaurantOrdersFeed({
    status: status || undefined,
    sort: 'placedAt',
    pollingInterval: wsActive ? 0 : 45_000,
  });

  useEffect(() => {
    trackAnalyticsEvent('restaurant_incoming_orders_viewed');
    trackAnalyticsEvent('order_queue_loaded');
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.color.background,
        padding: tokens.spacing.md,
        gap: tokens.spacing.md,
      }}
    >
      <Text variant="heading1" accessibilityRole="header">
        Incoming orders
      </Text>
      {!isConnected ? (
        <Text variant="caption" color={tokens.color.warning}>
          Offline — showing cached queue when available.
        </Text>
      ) : null}
      {wsActive ? (
        <Text variant="caption" color={tokens.color.textSecondary}>
          Live updates connected.
        </Text>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: tokens.spacing.sm,
        }}
      >
        {QUEUE_STATUS_FILTERS.map((option) => {
          const label = option || 'All';
          const active = status === option;
          return (
            <Pressable
              key={label}
              onPress={() => {
                setStatus(option);
                trackAnalyticsEvent('filter_changed', { status: label });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Filter ${label}`}
              style={{
                paddingHorizontal: tokens.spacing.md,
                paddingVertical: tokens.spacing.sm,
                borderRadius: tokens.radius.md,
                backgroundColor: active
                  ? tokens.color.accent
                  : tokens.color.surface,
                borderWidth: 1,
                borderColor: tokens.color.border,
              }}
            >
              <Text
                variant="label"
                color={
                  active ? tokens.color.textInverse : tokens.color.textPrimary
                }
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {feed.isLoading ? (
        <OrderQueueSkeleton />
      ) : (
        <FlatList
          data={feed.items}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={{ gap: tokens.spacing.md, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={feed.isFetching && feed.items.length > 0}
              onRefresh={() => {
                void feed.refetch();
              }}
            />
          }
          onEndReached={() => feed.onLoadMore()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyState
              title="All caught up"
              description="No orders in this filter. New orders will appear here."
              accessibilityLabel="Order queue empty"
            />
          }
          renderItem={({ item }) => (
            <OrderQueueItem
              order={item}
              onPress={() => {
                trackAnalyticsEvent('order_opened', { orderId: item.orderId });
                navigation.navigate('RestaurantOrderDetails', {
                  orderId: item.orderId,
                });
              }}
            />
          )}
        />
      )}
    </View>
  );
}
