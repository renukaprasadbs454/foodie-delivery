import React, { useEffect } from 'react';
import { View, ScrollView } from 'react-native';
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
    <ScrollView
      style={{ flex: 1, backgroundColor: tokens.color.background }}
      contentContainerStyle={{
        padding: tokens.spacing.lg,
        gap: tokens.spacing.md,
        paddingBottom: 48,
        alignItems: 'stretch',
      }}
    >
      {/* Celebration Header Animation / Icon */}
      <View style={{ alignItems: 'center', marginVertical: tokens.spacing.lg, gap: tokens.spacing.sm }}>
        <View style={{
          width: 84,
          height: 84,
          borderRadius: 42,
          backgroundColor: '#DCFCE7', // Light green brand tint
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#14532D',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}>
          <Text style={{ fontSize: 38 }}>🎉</Text>
        </View>

        <Text variant="heading1" style={{ fontWeight: '900', color: tokens.color.textPrimary, textAlign: 'center' }}>
          Order Confirmed!
        </Text>
        <Text variant="bodySmall" color={tokens.color.textSecondary} style={{ textAlign: 'center', paddingHorizontal: tokens.spacing.xl }}>
          Your payment succeeded. Relax while your preparation starts!
        </Text>
      </View>

      {orderQuery.isLoading && !orderQuery.data ? (
        <OrderSummarySkeleton />
      ) : orderQuery.isError && !orderQuery.data ? (
        <EmptyState
          title="Order not found"
          description="We could not load this order details."
          accessibilityLabel="Order not found"
          actionLabel="Retry"
          onAction={() => {
            void orderQuery.refetch();
          }}
        />
      ) : orderQuery.data ? (
        <OrderSummaryCard order={orderQuery.data} />
      ) : null}

      <View style={{ gap: tokens.spacing.sm, marginTop: tokens.spacing.md }}>
        <Button
          label="Live Track Your Delivery"
          accessibilityLabel="Track order"
          onPress={() => {
            trackAnalyticsEvent('track_order_tapped', { orderId });
            navigation.replace('LiveOrderTracking', { orderId });
          }}
          style={{
            height: 52,
            borderRadius: tokens.radius.lg,
            backgroundColor: tokens.color.accent, // Brand green accent
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
          style={{
            height: 48,
            borderRadius: tokens.radius.md,
            borderColor: tokens.color.border,
            backgroundColor: 'transparent',
          }}
        />
      </View>
    </ScrollView>
  );
}

