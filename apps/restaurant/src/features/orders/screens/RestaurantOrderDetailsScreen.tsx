import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useGetOrderQuery,
  useTransitionOrderStatusMutation,
} from '../../../api/endpoints/ordersApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { useAppSelector } from '../../../store/hooks';
import { selectRestaurantId } from '../../onboarding/restaurantOnboardingSlice';
import { OrderDetailSkeleton } from '../components/OrderDetailSkeleton';
import { useRestaurantOrdersSubscription } from '../hooks/useRestaurantOrdersSubscription';
import {
  formatMoney,
  isOrderId,
  restaurantActionsForStatus,
  validateRejectReason,
  type RestaurantTransitionStatus,
} from '../types';
import type { OrdersStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<
  OrdersStackParamList,
  'RestaurantOrderDetails'
>;

/**
 * P2-RES-02 Order Details — ACCEPTED|REJECTED|PREPARING|READY_FOR_PICKUP.
 * No optimistic transitions; REJECTED requires reason ≤500.
 */
export function RestaurantOrderDetailsScreen({ route }: Props) {
  const { orderId } = route.params;
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const restaurantId = useAppSelector(selectRestaurantId);
  const { wsActive } = useRestaurantOrdersSubscription(restaurantId);
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const validId = isOrderId(orderId);
  const query = useGetOrderQuery(orderId, {
    skip: !validId,
    pollingInterval: wsActive ? 0 : 45_000,
    refetchOnFocus: true,
  });
  const [transition, transitionState] = useTransitionOrderStatusMutation();

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onInlineField: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onFullScreen: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) => setToast({ message: error.message, variant: 'error' }),
  });

  useEffect(() => {
    trackAnalyticsEvent('restaurant_order_details_viewed', { orderId });
  }, [orderId]);

  const onTransition = async (targetStatus: RestaurantTransitionStatus) => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to update order status.',
        variant: 'warning',
      });
      return;
    }
    let reason: string | null = null;
    if (targetStatus === 'REJECTED') {
      const validated = validateRejectReason(rejectReason);
      if (!validated.ok) {
        setToast({ message: validated.message, variant: 'error' });
        return;
      }
      reason = validated.reason;
      trackAnalyticsEvent('reject_tapped', { orderId });
    } else if (targetStatus === 'ACCEPTED') {
      trackAnalyticsEvent('accept_tapped', { orderId });
    } else {
      trackAnalyticsEvent('status_advanced', { orderId, targetStatus });
    }
    try {
      await transition({ orderId, targetStatus, reason }).unwrap();
      trackAnalyticsEvent('order_status_changed', { orderId, targetStatus });
      setShowReject(false);
      setRejectReason('');
      setToast({ message: `Status updated to ${targetStatus}.`, variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

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
          description="Order id must be a valid UUID."
          accessibilityLabel="Invalid order id"
        />
      </View>
    );
  }

  const order = query.data;
  const actions = restaurantActionsForStatus(order?.status);

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
            refreshing={query.isFetching}
            onRefresh={() => {
              void query.refetch();
            }}
          />
        }
      >
        {query.isLoading && !order ? (
          <OrderDetailSkeleton />
        ) : query.isError && !order ? (
          <EmptyState
            title="Order not found"
            description="This order may not belong to your restaurant."
            accessibilityLabel="Order not found"
            actionLabel="Retry"
            onAction={() => {
              void query.refetch();
            }}
          />
        ) : order ? (
          <>
            <Text variant="heading1" accessibilityRole="header">
              {order.orderNumber}
            </Text>
            <Text variant="body" color={tokens.color.textSecondary}>
              Status: {order.status}
            </Text>
            {!isConnected ? (
              <Text variant="caption" color={tokens.color.warning}>
                Offline — status changes blocked.
              </Text>
            ) : null}

            <View style={{ gap: tokens.spacing.xs }}>
              <Text variant="label">Totals</Text>
              <Text variant="body">Subtotal {formatMoney(order.subtotal)}</Text>
              <Text variant="body">
                Delivery {formatMoney(order.deliveryFee)}
              </Text>
              <Text variant="body">
                Discount {formatMoney(order.discountAmount)}
              </Text>
              <Text variant="body">Tax {formatMoney(order.taxAmount)}</Text>
              <Text variant="label">Total {formatMoney(order.totalAmount)}</Text>
            </View>

            <View style={{ gap: tokens.spacing.xs }}>
              <Text variant="label">Items</Text>
              {(order.items ?? []).length === 0 ? (
                <Text variant="body" color={tokens.color.textSecondary}>
                  No line items.
                </Text>
              ) : (
                (order.items ?? []).map((item, index) => (
                  <Text
                    key={`${item.menuItemId ?? 'item'}-${index}`}
                    variant="body"
                  >
                    {item.quantity}× {item.name ?? 'Item'} —{' '}
                    {formatMoney(item.lineTotal)}
                  </Text>
                ))
              )}
            </View>

            {showReject ? (
              <View style={{ gap: tokens.spacing.sm }}>
                <TextInput
                  label="Reject reason"
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  accessibilityLabel="Reject reason"
                  multiline
                />
                <Button
                  label="Confirm reject"
                  accessibilityLabel="Confirm reject"
                  variant="danger"
                  loading={transitionState.isLoading}
                  onPress={() => {
                    void onTransition('REJECTED');
                  }}
                />
                <Button
                  label="Cancel"
                  accessibilityLabel="Cancel reject"
                  variant="secondary"
                  onPress={() => {
                    setShowReject(false);
                    setRejectReason('');
                  }}
                />
              </View>
            ) : (
              <View style={{ gap: tokens.spacing.sm }}>
                {actions.map((action) => (
                  <Button
                    key={action}
                    label={
                      action === 'ACCEPTED'
                        ? 'Accept'
                        : action === 'REJECTED'
                          ? 'Reject'
                          : action === 'PREPARING'
                            ? 'Start preparing'
                            : 'Ready for pickup'
                    }
                    accessibilityLabel={action}
                    variant={action === 'REJECTED' ? 'danger' : 'primary'}
                    loading={transitionState.isLoading}
                    onPress={() => {
                      if (action === 'REJECTED') {
                        setShowReject(true);
                        return;
                      }
                      void onTransition(action);
                    }}
                  />
                ))}
              </View>
            )}
          </>
        ) : null}
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
