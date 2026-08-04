import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  Modal,
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
import type { OrdersStackParamList } from '../../../navigation/types';
import { OrderStatusStepper } from '../components/OrderStatusStepper';
import { TrackingMap } from '../components/TrackingMap';
import { TrackingSkeleton } from '../components/TrackingSkeleton';
import { useOrderTrackingSubscription } from '../hooks/useOrderTrackingSubscription';
import {
  canCustomerCancelOrder,
  isOrderId,
  isTerminalOrderStatus,
  validateCancelReason,
} from '../types';

type Props = NativeStackScreenProps<OrdersStackParamList, 'LiveOrderTracking'>;

/**
 * P2-CUS-06 Live Order Tracking — status stepper + map shell + cancel pre-PREPARING.
 * WS `/topic/order/{orderId}` while focused & non-terminal; polling fallback.
 */
export function LiveOrderTrackingScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const validId = isOrderId(orderId);

  const [cancelVisible, setCancelVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const [transitionStatus, transitionState] = useTransitionOrderStatusMutation();

  const orderQuery = useGetOrderQuery(orderId, {
    skip: !validId,
    pollingInterval: 0,
    refetchOnFocus: true,
  });

  const status = orderQuery.data?.status;
  const terminal = isTerminalOrderStatus(status);
  const { location, wsActive } = useOrderTrackingSubscription(
    validId ? orderId : '',
    status,
  );

  // Separate subscription drives fallback polling (shared cache).
  const pollSubscription = useGetOrderQuery(orderId, {
    skip: !validId || terminal,
    pollingInterval: wsActive ? 8000 : 2500,
  });
  void pollSubscription;

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
    trackAnalyticsEvent('customer_order_tracking_viewed', { orderId });
    trackAnalyticsEvent('order_status_viewed', { orderId, status });
  }, [orderId, status]);

  const onCancel = async () => {
    const validated = validateCancelReason(cancelReason);
    if (!validated.ok) {
      setToast({ message: validated.message, variant: 'error' });
      return;
    }
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to cancel this order.',
        variant: 'warning',
      });
      return;
    }
    try {
      await transitionStatus({
        orderId,
        targetStatus: 'CANCELLED',
        reason: validated.reason,
      }).unwrap();
      trackAnalyticsEvent('cancel_tapped', { orderId });
      setCancelVisible(false);
      setCancelReason('');
      setToast({ message: 'Order cancelled.', variant: 'success' });
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
          description="This tracking link is not valid."
          accessibilityLabel="Invalid tracking order id"
          actionLabel="My orders"
          onAction={() => navigation.navigate('MyOrders')}
        />
      </View>
    );
  }

  const order = orderQuery.data;
  const loading = orderQuery.isLoading && !order;

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
          Track order
        </Text>
        {!isConnected ? (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — showing cached status. Cancel is unavailable.
          </Text>
        ) : null}

        {loading ? (
          <TrackingSkeleton />
        ) : orderQuery.isError && !order ? (
          <EmptyState
            title="Order not found"
            description="We could not load this order."
            accessibilityLabel="Tracking order not found"
            actionLabel="Retry"
            onAction={() => {
              void orderQuery.refetch();
            }}
          />
        ) : order ? (
          <>
            <Text variant="label" color={tokens.color.textSecondary}>
              {order.orderNumber}
            </Text>
            <OrderStatusStepper status={order.status} />
            <TrackingMap location={location} orderStatus={order.status} />

            {canCustomerCancelOrder(order.status) ? (
              <Button
                label="Cancel order"
                accessibilityLabel="Cancel order"
                variant="secondary"
                disabled={!isConnected || transitionState.isLoading}
                onPress={() => {
                  trackAnalyticsEvent('cancel_tapped', {
                    orderId,
                    phase: 'open',
                  });
                  setCancelVisible(true);
                }}
              />
            ) : null}

            {order.status === 'DELIVERED' ? (
              <Button
                label="Leave a review"
                accessibilityLabel="Leave a review"
                onPress={() =>
                  navigation.navigate('Reviews', {
                    mode: 'submit',
                    orderId,
                    restaurantId: order.restaurantId,
                  })
                }
              />
            ) : null}

            <Button
              label="My orders"
              accessibilityLabel="My orders"
              variant="secondary"
              onPress={() => navigation.navigate('MyOrders')}
            />
          </>
        ) : null}
      </ScrollView>

      <Modal
        visible={cancelVisible}
        onRequestClose={() => setCancelVisible(false)}
        title="Cancel order"
        accessibilityLabel="Cancel order dialog"
      >
        <View style={{ gap: tokens.spacing.md }}>
          <Text variant="body">
            Tell us why you are cancelling. This cannot be undone.
          </Text>
          <TextInput
            value={cancelReason}
            onChangeText={setCancelReason}
            placeholder="Reason"
            accessibilityLabel="Cancel reason"
            maxLength={500}
          />
          <Button
            label="Confirm cancel"
            accessibilityLabel="Confirm cancel"
            disabled={transitionState.isLoading}
            onPress={() => {
              void onCancel();
            }}
          />
          <Button
            label="Keep order"
            accessibilityLabel="Keep order"
            variant="secondary"
            onPress={() => setCancelVisible(false)}
          />
        </View>
      </Modal>

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
