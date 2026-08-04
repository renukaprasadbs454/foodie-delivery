import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  Text,
  Toast,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetOrderQuery } from '../../../api/endpoints/ordersApi';
import { AssignmentDetailSkeleton } from '../components/AssignmentDetailSkeleton';
import { useAssignmentOrderSubscription } from '../hooks/useAssignmentOrderSubscription';
import { formatMoney, isUuid } from '../types';
import { legForOrderStatus } from '../../navigation/types';
import type { MainStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'AssignmentDetails'>;

/**
 * P2-DEL-02/03 — GET /orders/{id} for assignment detail.
 * Entry to DeliveryNavigation / PickupOtp / DeliveryOtp.
 */
export function AssignmentDetailsScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const { orderId, assignmentId } = route.params;
  const validOrderId = Boolean(orderId && isUuid(orderId));
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const orderQuery = useGetOrderQuery(orderId, {
    skip: !validOrderId,
    pollingInterval: 30_000,
    refetchOnFocus: true,
  });

  const { wsActive } = useAssignmentOrderSubscription(
    validOrderId ? orderId : undefined,
    orderQuery.data?.status,
  );

  useEffect(() => {
    trackAnalyticsEvent('delivery_assignment_details_viewed');
    trackAnalyticsEvent('assignment_opened', {
      orderId,
      ...(assignmentId ? { assignmentId } : {}),
    });
  }, [assignmentId, orderId]);

  if (!validOrderId) {
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
          title="Invalid order link"
          description="Assignment details require a valid order id."
          accessibilityLabel="Invalid order id"
        />
      </View>
    );
  }

  const order = orderQuery.data;
  const loading = orderQuery.isLoading && !order;
  const status = order?.status;
  const requireAssignmentId = () => {
    if (!assignmentId) {
      setToast({
        message:
          'Assignment id is required for navigation and OTP. Accept an offer in this session (deep links only provide orderId).',
        variant: 'warning',
      });
      return false;
    }
    return true;
  };

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
            refreshing={orderQuery.isFetching}
            onRefresh={() => {
              void orderQuery.refetch();
            }}
          />
        }
      >
        <Text variant="heading1" accessibilityRole="header">
          Assignment
        </Text>
        {assignmentId ? (
          <Text variant="caption" color={tokens.color.textSecondary}>
            Assignment {assignmentId}
          </Text>
        ) : (
          <Text variant="caption" color={tokens.color.textSecondary}>
            Deep link — assignment id unknown; showing order {orderId}.
          </Text>
        )}
        {!isConnected ? (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — showing cached order when available.
          </Text>
        ) : null}
        <Text variant="caption" color={tokens.color.textSecondary}>
          Live updates: {wsActive ? 'connected' : 'polling fallback'}
        </Text>
        {loading ? <AssignmentDetailSkeleton /> : null}
        {orderQuery.isError && !order ? (
          <EmptyState
            title="Assignment not found"
            description="Could not load this order. It may be unassigned or unavailable."
            accessibilityLabel="Assignment not found"
          />
        ) : null}
        {order ? (
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
            <Text variant="heading3">Order {order.orderNumber}</Text>
            <Text variant="body">Status: {order.status}</Text>
            <Text variant="body">Total: {formatMoney(order.totalAmount)}</Text>
            {(order.items ?? []).map((item, index) => (
              <Text
                key={`${item.menuItemId ?? 'item'}-${index}`}
                variant="caption"
                color={tokens.color.textSecondary}
              >
                {item.quantity}× {item.name ?? 'Item'} —{' '}
                {formatMoney(item.lineTotal ?? item.unitPrice)}
              </Text>
            ))}
          </View>
        ) : null}
        <Button
          label="Start navigation"
          accessibilityLabel="Start navigation"
          variant="secondary"
          onPress={() => {
            trackAnalyticsEvent('start_navigation_tapped', { orderId });
            if (!requireAssignmentId() || !assignmentId) return;
            navigation.navigate('DeliveryNavigation', {
              assignmentId,
              orderId,
              leg: legForOrderStatus(status),
            });
          }}
          style={{ minHeight: 48 }}
        />
        <Button
          label="Verify pickup"
          accessibilityLabel="Verify pickup"
          variant="secondary"
          onPress={() => {
            trackAnalyticsEvent('verify_pickup_tapped', { orderId });
            if (!requireAssignmentId() || !assignmentId) return;
            navigation.navigate('PickupOtp', { assignmentId, orderId });
          }}
          style={{ minHeight: 48 }}
        />
        {status === 'OUT_FOR_DELIVERY' || status === 'PICKED_UP' ? (
          <Button
            label="Verify delivery"
            accessibilityLabel="Verify delivery"
            variant="secondary"
            onPress={() => {
              if (!requireAssignmentId() || !assignmentId) return;
              navigation.navigate('DeliveryOtp', { assignmentId, orderId });
            }}
            style={{ minHeight: 48 }}
          />
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
