import React, { useEffect, useState } from 'react';
import { ScrollView, View, ActivityIndicator, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { useGetRestaurantQuery } from '../../../api/endpoints/restaurantsApi';
import { useGetAddressesQuery } from '../../../api/endpoints/addressesApi';
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
    pollingInterval: 3000,
    refetchOnFocus: true,
  });

  const status = orderQuery.data?.status;
  const terminal = isTerminalOrderStatus(status);
  const { location, wsActive } = useOrderTrackingSubscription(
    validId ? orderId : '',
    status,
  );

  const [eta, setEta] = useState<number | null>(null);

  const { data: restaurant } = useGetRestaurantQuery(orderQuery.data?.restaurantId ?? '', { skip: !orderQuery.data?.restaurantId });
  const { data: addresses } = useGetAddressesQuery(undefined, { skip: !orderQuery.data?.addressId });
  const address = addresses?.find(a => a.addressId === orderQuery.data?.addressId);

  const restaurantLocation = restaurant?.latitude && restaurant?.longitude
    ? { latitude: Number(restaurant.latitude), longitude: Number(restaurant.longitude) }
    : undefined;

  const customerLocation = address?.latitude && address?.longitude
    ? { latitude: Number(address.latitude), longitude: Number(address.longitude) }
    : undefined;

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

  const renderHeaderUi = (currentStatus: string) => {
    let title = 'Order Placed';
    let icon = '🕒';

    switch (currentStatus) {
      case 'PLACED':
        title = 'Order Placed';
        icon = '✅';
        break;
      case 'ACCEPTED':
        title = 'Restaurant Accepted';
        icon = '🧑‍🍳';
        break;
      case 'PREPARING':
        title = 'Food is preparing';
        icon = '🍳';
        break;
      case 'READY_FOR_PICKUP':
      case 'REACHED_RESTAURANT':
        title = 'Ready to pickup';
        icon = '🛍️';
        break;
      case 'ASSIGNED':
        title = 'Delivery Partner Assigned';
        icon = '🛵';
        break;
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        title = 'Order is on the way';
        icon = '🤟';
        break;
      case 'DELIVERED':
        title = 'Order Delivered';
        icon = '🎉';
        break;
      case 'CANCELLED':
        title = 'Order Cancelled';
        icon = '❌';
        break;
    }

    return (
      <LinearGradient
        colors={['#0F3E22', '#14532D', '#1B6A3A']}
        style={{ padding: 24, paddingTop: 48, paddingBottom: 60, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }}
      >
        <Text style={{ color: '#FCD34D', fontSize: 26, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>{title} {icon}</Text>
        {eta !== null && (
          <View style={{ backgroundColor: 'rgba(252, 211, 77, 0.2)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, marginTop: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(252, 211, 77, 0.3)' }}>
            <Text style={{ color: '#FEF3C7', fontWeight: '800', fontSize: 17, letterSpacing: 0.5 }}>Arrival in {eta} mins</Text>
          </View>
        )}
      </LinearGradient>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: 48,
        }}
        bounces={false}
      >
        {loading ? (
          <TrackingSkeleton />
        ) : orderQuery.isError && !order ? (
          <EmptyState
            title="Order not found"
            description="We could not load this order."
            accessibilityLabel="Tracking order not found"
            actionLabel="Retry"
            onAction={() => void orderQuery.refetch()}
          />
        ) : order ? (
          <>
            {renderHeaderUi(order.status)}

            {order.status === 'PREPARING' || order.status === 'PLACED' || order.status === 'ACCEPTED' ? (
              <View style={{ paddingHorizontal: tokens.spacing.md, marginTop: tokens.spacing.md }}>
                <View style={{
                  padding: 32,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 24,
                  alignItems: 'center',
                  elevation: 5,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6,
                  borderColor: '#E5E7EB',
                  borderWidth: 1
                }}>
                  <ActivityIndicator size="large" color="#14532D" style={{ marginBottom: 16 }} />
                  <Text style={{ fontSize: 18, color: '#14532D', fontWeight: '800', textAlign: 'center' }}>Searching nearby delivery partner...</Text>
                  <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center' }}>Please wait while we assign the best rider for your order.</Text>
                </View>
              </View>
            ) : order.status === 'DELIVERED' ? (
              <View style={{ paddingHorizontal: tokens.spacing.md, marginTop: tokens.spacing.md }}>
                <View style={{
                  padding: 32,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 24,
                  alignItems: 'center',
                  elevation: 5,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8,
                  borderColor: '#FCD34D',
                  borderWidth: 2
                }}>
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>🌟</Text>
                  <Text style={{ fontSize: 20, color: '#14532D', fontWeight: '900', textAlign: 'center' }}>Enjoyed your meal?</Text>
                  <Text style={{ fontSize: 15, color: '#6B7280', marginTop: 8, textAlign: 'center', marginBottom: 20 }}>Rate the restaurant and your delivery partner to help us improve!</Text>

                  <Pressable
                    onPress={() => {
                      navigation.navigate('Reviews', {
                        mode: 'submit',
                        orderId: order.orderId,
                        restaurantId: order.restaurantId
                      } as never);
                    }}
                    style={{
                      backgroundColor: '#14532D',
                      paddingHorizontal: 24,
                      paddingVertical: 14,
                      borderRadius: 24,
                      width: '100%',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: '#FCD34D', fontWeight: 'bold', fontSize: 16 }}>Rate This Order</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={{ paddingHorizontal: tokens.spacing.md, marginTop: tokens.spacing.md }}>
                <TrackingMap
                  location={location}
                  orderStatus={order.status}
                  restaurantLocation={restaurantLocation}
                  customerLocation={customerLocation}
                  onEtaUpdate={setEta}
                />
              </View>
            )}

            {/* Mock Zomato-style Delivery Partner Block */}
            {['ASSIGNED', 'REACHED_RESTAURANT', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                padding: tokens.spacing.md,
                borderRadius: tokens.radius.lg,
                marginTop: tokens.spacing.md,
                marginHorizontal: tokens.spacing.md,
                elevation: 4,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
              }}>
                <View style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: '#E5E7EB',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden'
                }}>
                  <Text style={{ fontSize: 28 }}>👨🏽‍✈️</Text>
                </View>
                <View style={{ flex: 1, marginLeft: tokens.spacing.md }}>
                  <Text variant="heading3" style={{ fontWeight: '800', color: '#14532D' }}>Suresh Kumar</Text>
                  <Text variant="caption" style={{ color: tokens.color.textSecondary, fontWeight: '600' }}>
                    ★ 4.9 • KA-06-EN-4493
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button
                    label="Chat"
                    accessibilityLabel="Chat Delivery Partner"
                    variant="secondary"
                    onPress={() => setToast({ message: 'Opening chat...', variant: 'info' })}
                    style={{ borderRadius: tokens.radius.full, paddingHorizontal: 16 }}
                  />
                  <Button
                    label="Call"
                    accessibilityLabel="Call Delivery Partner"
                    variant="primary"
                    onPress={() => setToast({ message: 'Calling Suresh Kumar...', variant: 'info' })}
                    style={{ borderRadius: tokens.radius.full, paddingHorizontal: 16, backgroundColor: '#14532D' }}
                  />
                </View>
              </View>
            )}

            <View style={{ paddingHorizontal: tokens.spacing.md }}>
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
                  style={{ marginTop: tokens.spacing.md }}
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
                  style={{ marginTop: tokens.spacing.md }}
                />
              ) : null}

              <Button
                label="My orders"
                accessibilityLabel="My orders"
                variant="secondary"
                onPress={() => navigation.navigate('MyOrders')}
                style={{ marginTop: tokens.spacing.md }}
              />
            </View>
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
    </View >
  );
}
