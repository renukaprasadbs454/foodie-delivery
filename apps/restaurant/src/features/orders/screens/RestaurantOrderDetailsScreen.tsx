import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Card,
  EmptyState,
  Text,
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
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderTimeline } from '../components/OrderTimeline';
import { RejectOrderModal } from '../components/RejectOrderModal';
import { useRestaurantOrdersSubscription } from '../hooks/useRestaurantOrdersSubscription';
import {
  formatMoney,
  isOrderId,
  restaurantActionsForStatus,
  type RestaurantTransitionStatus,
} from '../types';
import type { OrdersStackParamList } from '../../../navigation/types';
import { DemoModeIndicator } from '../../../components/DemoModeIndicator';
import { MOCK_CONFIG } from '../../../config/mockConfig';
import { getMockOrderDetails, type ExtendedOrderDetail } from '../../../mock';

type Props = NativeStackScreenProps<
  OrdersStackParamList,
  'RestaurantOrderDetails'
>;

const BRAND_PRIMARY = '#14532D'; // Dark Green
const BRAND_ACCENT = '#F59E0B';  // Gold

export function RestaurantOrderDetailsScreen({ route }: Props) {
  const { orderId } = route.params;
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const storedRestaurantId = useAppSelector(selectRestaurantId);
  const restaurantId =
    storedRestaurantId ??
    (MOCK_CONFIG.ENABLE_MOCK_FALLBACK ? MOCK_CONFIG.DEFAULT_MOCK_RESTAURANT_ID : undefined);

  const { wsActive } = useRestaurantOrdersSubscription(restaurantId ?? null);
  const [showRejectModal, setShowRejectModal] = useState(false);

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

  const [transition] = useTransitionOrderStatusMutation();

  // Local demo state override for order status transitions
  const mockOrderInitial = getMockOrderDetails(orderId);
  const [localOrder, setLocalOrder] = useState<ExtendedOrderDetail>(mockOrderInitial);

  useEffect(() => {
    setLocalOrder(getMockOrderDetails(orderId));
  }, [orderId]);

  const apiOrder = query.data;
  const isUsingMock =
    MOCK_CONFIG.ENABLE_MOCK_FALLBACK &&
    (!isConnected || query.isError || !apiOrder);

  const order = (apiOrder ?? (isUsingMock ? localOrder : undefined)) as ExtendedOrderDetail | undefined;

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

  const onTransition = async (
    targetStatus: RestaurantTransitionStatus,
    reason?: string,
  ) => {
    if (isUsingMock) {
      setLocalOrder((prev) => ({
        ...prev,
        status: targetStatus,
        orderStatusEvents: [
          ...(prev.orderStatusEvents ?? []),
          {
            eventId: `e-demo-${Date.now()}`,
            fromStatus: prev.status,
            toStatus: targetStatus,
            reason: reason ?? null,
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      setShowRejectModal(false);
      setToast({
        message: `Order status set to ${targetStatus} (Demo Mode).`,
        variant: 'success',
      });
      return;
    }

    try {
      await transition({ orderId, targetStatus, reason: reason ?? null }).unwrap();
      setShowRejectModal(false);
      setToast({ message: `Status updated to ${targetStatus}.`, variant: 'success' });
      void query.refetch();
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  if (!validId && !isUsingMock) {
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
          title="Invalid Order"
          description="Order ID must be a valid UUID."
          accessibilityLabel="Invalid order id"
        />
      </View>
    );
  }

  const actions = restaurantActionsForStatus(order?.status);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 80,
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
        {/* DEMO MODE INDICATOR */}
        {isUsingMock ? <DemoModeIndicator isMockActive={true} /> : null}

        {query.isLoading && !order && !isUsingMock ? (
          <OrderDetailSkeleton />
        ) : !order ? (
          <EmptyState
            title="Order Not Found"
            description="This order details could not be retrieved."
            accessibilityLabel="Order not found"
            actionLabel="Retry"
            onAction={() => {
              void query.refetch();
            }}
          />
        ) : (
          <>
            {/* ORDER HEADER CARD */}
            <Card
              style={{
                padding: tokens.spacing.lg,
                borderRadius: 14,
                gap: tokens.spacing.sm,
                borderLeftWidth: 5,
                borderLeftColor: BRAND_PRIMARY,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ gap: 2 }}>
                  <Text variant="heading1" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
                    {order.orderNumber}
                  </Text>
                  <Text variant="caption" color={tokens.color.textSecondary}>
                    {order.placedAt ? `Placed at ${new Date(order.placedAt).toLocaleString()}` : 'Order'}
                  </Text>

                  {order.customerName ? (
                    <Text variant="label" style={{ color: tokens.color.textPrimary, marginTop: 2 }}>
                      👤 Customer: {order.customerName}
                    </Text>
                  ) : order.customerId ? (
                    <Text variant="caption" color={tokens.color.textSecondary}>
                      Customer ID: {order.customerId}
                    </Text>
                  ) : null}

                  {order.deliveryAddress ? (
                    <Text variant="caption" color={tokens.color.textSecondary} style={{ marginTop: 2 }}>
                      📍 {order.deliveryAddress}
                    </Text>
                  ) : null}
                </View>
                <OrderStatusBadge status={order.status} size="lg" />
              </View>
            </Card>

            {/* ORDER TIMELINE CARD */}
            <Card style={{ padding: tokens.spacing.md, borderRadius: 14 }}>
              <OrderTimeline status={order.status} />
            </Card>

            {/* ORDERED ITEMS LIST CARD */}
            <Card style={{ padding: tokens.spacing.md, borderRadius: 14, gap: tokens.spacing.sm }}>
              <Text variant="heading2" style={{ color: BRAND_PRIMARY, fontSize: 17 }}>
                Ordered Food Items
              </Text>
              <View style={{ height: 1, backgroundColor: tokens.color.border }} />

              {(order.items ?? []).length === 0 ? (
                <Text variant="body" color={tokens.color.textSecondary}>
                  No line items provided for this order.
                </Text>
              ) : (
                (order.items ?? []).map((item, index) => (
                  <View
                    key={`${item.menuItemId ?? 'item'}-${index}`}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: tokens.spacing.xs,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm }}>
                      <View
                        style={{
                          backgroundColor: '#DCFCE7',
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text variant="label" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
                          {item.quantity}x
                        </Text>
                      </View>
                      <View>
                        <Text variant="body" style={{ color: tokens.color.textPrimary, fontWeight: '600' }}>
                          {item.name ?? 'Food Item'}
                        </Text>
                        {item.unitPrice ? (
                          <Text variant="caption" color={tokens.color.textSecondary}>
                            {formatMoney(item.unitPrice)} each
                          </Text>
                        ) : null}
                      </View>
                    </View>

                    <Text variant="label" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
                      {formatMoney(item.lineTotal)}
                    </Text>
                  </View>
                ))
              )}
            </Card>

            {/* FINANCIAL SUMMARY CARD */}
            <Card style={{ padding: tokens.spacing.md, borderRadius: 14, gap: tokens.spacing.xs }}>
              <Text variant="heading2" style={{ color: BRAND_PRIMARY, fontSize: 17, marginBottom: 4 }}>
                Financial Summary
              </Text>
              <View style={{ height: 1, backgroundColor: tokens.color.border, marginBottom: 4 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="body" color={tokens.color.textSecondary}>Subtotal</Text>
                <Text variant="body" style={{ color: tokens.color.textPrimary }}>{formatMoney(order.subtotal)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="body" color={tokens.color.textSecondary}>Delivery Fee</Text>
                <Text variant="body" style={{ color: tokens.color.textPrimary }}>{formatMoney(order.deliveryFee)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="body" color={tokens.color.textSecondary}>Discounts</Text>
                <Text variant="body" style={{ color: '#16A34A' }}>-{formatMoney(order.discountAmount)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="body" color={tokens.color.textSecondary}>Taxes & Fees</Text>
                <Text variant="body" style={{ color: tokens.color.textPrimary }}>{formatMoney(order.taxAmount)}</Text>
              </View>

              <View style={{ height: 1, backgroundColor: tokens.color.border, marginVertical: tokens.spacing.xs }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="heading2" style={{ color: BRAND_PRIMARY, fontSize: 18 }}>
                  Total Amount
                </Text>
                <Text variant="heading1" style={{ color: BRAND_ACCENT, fontSize: 24, fontWeight: 'bold' }}>
                  {formatMoney(order.totalAmount)}
                </Text>
              </View>
            </Card>

            {/* KITCHEN ORDER ACTIONS CARD */}
            {actions.length > 0 ? (
              <Card style={{ padding: tokens.spacing.md, gap: tokens.spacing.sm, borderRadius: 14 }}>
                <Text variant="label" style={{ color: BRAND_PRIMARY, fontSize: 16 }}>
                  Kitchen Order Actions
                </Text>
                <View style={{ gap: tokens.spacing.sm }}>
                  {actions.map((action) => (
                    <Button
                      key={action}
                      label={
                        action === 'ACCEPTED'
                          ? 'Accept Order & Send to Kitchen'
                          : action === 'REJECTED'
                            ? 'Reject Order'
                            : action === 'PREPARING'
                              ? 'Start Food Preparation 🍳'
                              : 'Mark Ready for Delivery Pickup 📦'
                      }
                      accessibilityLabel={action}
                      style={{
                        backgroundColor: action === 'REJECTED' ? '#DC2626' : BRAND_PRIMARY,
                      }}
                      onPress={() => {
                        if (action === 'REJECTED') {
                          setShowRejectModal(true);
                          return;
                        }
                        void onTransition(action);
                      }}
                    />
                  ))}
                </View>
              </Card>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* REJECT MODAL */}
      <RejectOrderModal
        visible={showRejectModal}
        orderNumber={order?.orderNumber}
        loading={false}
        onConfirm={(reason) => {
          void onTransition('REJECTED', reason);
        }}
        onCancel={() => setShowRejectModal(false)}
      />

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
