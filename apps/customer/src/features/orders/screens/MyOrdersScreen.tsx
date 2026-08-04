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
import type { OrdersStackParamList } from '../../../navigation/types';
import { OrderListItem } from '../components/OrderListItem';
import { OrderListSkeleton } from '../components/OrderListSkeleton';
import { useMyOrdersFeed } from '../hooks/useMyOrdersFeed';
import { ORDER_SORT_WHITELIST, isOrderSort, type OrderSort } from '../types';

type Props = NativeStackScreenProps<OrdersStackParamList, 'MyOrders'>;

const STATUS_FILTERS = [
  '',
  'CONFIRMED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
] as const;

/**
 * P2-CUS-06 My Orders — paginated history; non-terminal → LiveOrderTracking.
 */
export function MyOrdersScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const [sort, setSort] = useState<OrderSort>('placedAt');
  const [status, setStatus] = useState('');

  const feed = useMyOrdersFeed({
    sort,
    status: status || undefined,
  });

  useEffect(() => {
    trackAnalyticsEvent('customer_my_orders_viewed');
    trackAnalyticsEvent('orders_list_loaded');
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
        My orders
      </Text>
      {!isConnected ? (
        <Text variant="caption" color={tokens.color.warning}>
          Offline — showing cached history when available.
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }}>
        {ORDER_SORT_WHITELIST.map((option) => (
          <Pressable
            key={option}
            onPress={() => {
              if (!isOrderSort(option)) return;
              setSort(option);
              trackAnalyticsEvent('filter_changed', { sort: option });
            }}
            accessibilityRole="button"
            accessibilityLabel={`Sort by ${option}`}
            style={{
              paddingHorizontal: tokens.spacing.md,
              paddingVertical: tokens.spacing.sm,
              borderRadius: tokens.radius.md,
              backgroundColor:
                sort === option ? tokens.color.accent : tokens.color.surface,
              borderWidth: 1,
              borderColor: tokens.color.border,
            }}
          >
            <Text
              variant="label"
              color={
                sort === option
                  ? tokens.color.textInverse
                  : tokens.color.textPrimary
              }
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }}>
        {STATUS_FILTERS.map((option) => {
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
        <OrderListSkeleton />
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
              title="No orders yet"
              description="Browse restaurants to place your first order."
              accessibilityLabel="Orders empty"
              actionLabel="Browse"
              onAction={() => {
                const parent = navigation.getParent();
                if (parent) {
                  parent.navigate('BrowseTab' as never);
                }
              }}
            />
          }
          renderItem={({ item }) => (
            <OrderListItem
              order={item}
              onPress={() => {
                trackAnalyticsEvent('order_row_tapped', {
                  orderId: item.orderId,
                });
                navigation.navigate('LiveOrderTracking', {
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
