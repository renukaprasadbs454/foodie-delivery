import React, { useEffect } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  Text,
  trackAnalyticsEvent,
  useTheme,
} from 'foodie-shared-rn';
import { useGetOrderQuery } from '../../../api/endpoints/ordersApi';
import type { OrdersStackParamList } from '../../../navigation/types';
import { OrderSummaryCard } from '../components/OrderSummaryCard';
import { OrderSummarySkeleton } from '../components/OrderSummarySkeleton';
import { isOrderId } from '../types';

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderSuccess'>;

/**
 * P2-CUS-06 Order Success — post-payment confirmation; CTA → LiveOrderTracking.
 */
export function OrderSuccessScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const { tokens } = useTheme();
  const validId = isOrderId(orderId);
  const orderQuery = useGetOrderQuery(orderId, { skip: !validId });

  useEffect(() => {
    trackAnalyticsEvent('customer_order_success_viewed', { orderId });
    trackAnalyticsEvent('order_confirmed', { orderId });
  }, [orderId]);

  if (!validId) {
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
          title="Invalid order"
          description="This order link is not valid."
          accessibilityLabel="Invalid order id"
          actionLabel="Home"
          onAction={() => {
            const parent = navigation.getParent();
            parent?.navigate('BrowseTab' as never);
          }}
        />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.color.background,
        padding: tokens.spacing.xl,
        gap: tokens.spacing.md,
      }}
    >
      <Text variant="heading1" accessibilityRole="header">
        Order confirmed
      </Text>
      <Text variant="body" color={tokens.color.textSecondary}>
        Payment confirmed. Track your order for live updates.
      </Text>

      {orderQuery.isLoading && !orderQuery.data ? (
        <OrderSummarySkeleton />
      ) : orderQuery.isError && !orderQuery.data ? (
        <EmptyState
          title="Order not found"
          description="We could not load this order."
          accessibilityLabel="Order not found"
          actionLabel="Retry"
          onAction={() => {
            void orderQuery.refetch();
          }}
        />
      ) : orderQuery.data ? (
        <OrderSummaryCard order={orderQuery.data} />
      ) : null}

      <Button
        label="Track order"
        accessibilityLabel="Track order"
        onPress={() => {
          trackAnalyticsEvent('track_order_tapped', { orderId });
          navigation.replace('LiveOrderTracking', { orderId });
        }}
      />
      <Button
        label="Back to home"
        accessibilityLabel="Back to home"
        variant="secondary"
        onPress={() => {
          const parent = navigation.getParent();
          parent?.navigate('BrowseTab' as never);
        }}
      />
    </View>
  );
}
