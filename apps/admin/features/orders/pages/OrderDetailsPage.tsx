'use client';

import React, { useEffect, useState } from 'react';
import {
  Button,
  DataTableShell,
  EmptyState,
  Text,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-web';
import {
  useGetOrderQuery,
  useOverrideOrderStatusMutation,
} from '@/api/endpoints/ordersApi';
import { selectAdminRole } from '@/features/auth/authSlice';
import { useAppSelector } from '@/store/hooks';
import { canOverrideOrderStatus } from '@/lib/routeGuards';
import { PermissionDenied } from '@/features/analytics/components/PermissionDenied';
import { toUnwrappedApiError } from '@/features/restaurants/lib/apiError';
import { OrderDetailSkeleton } from '../components/OrderDetailSkeleton';
import { OverrideStatusModal } from '../components/OverrideStatusModal';
import { formatMoneyInr, type OrderStatus } from '../types';

type Props = {
  orderId: string;
};

/**
 * P2-ADM-04 order detail — GET /orders/{id} + POST override-status.
 */
export function OrderDetailsPage({ orderId }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const role = useAppSelector(selectAdminRole);
  const canOverride = canOverrideOrderStatus(role);

  const orderQuery = useGetOrderQuery(orderId, {
    skip: !orderId,
    refetchOnFocus: true,
  });
  const [overrideStatus, overrideState] = useOverrideOrderStatusMutation();

  const [overrideOpen, setOverrideOpen] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

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
    trackAnalyticsEvent('admin_orders_viewed', { orderId, surface: 'details' });
  }, [orderId]);

  const onOverride = async (targetStatus: string, reason: string) => {
    if (!canOverride) return;
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to override status.',
        variant: 'warning',
      });
      return;
    }
    trackAnalyticsEvent('override_submitted', { orderId, targetStatus });
    try {
      await overrideStatus({
        orderId,
        body: { targetStatus: targetStatus as OrderStatus, reason },
      }).unwrap();
      trackAnalyticsEvent('order_status_overridden', { orderId, targetStatus });
      setOverrideOpen(false);
      setToast({ message: 'Order status overridden.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  const data = orderQuery.data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
      <Text as="h1" variant="heading1">
        Order details
      </Text>

      {!isConnected ? (
        <Text as="p" variant="caption" color={tokens.color.warning}>
          Offline — showing cached order when available. Override blocked.
        </Text>
      ) : null}

      {!canOverride ? (
        <PermissionDenied description="OPS or SUPER_ADMIN required to override order status." />
      ) : null}

      {orderQuery.isLoading && !data ? (
        <OrderDetailSkeleton />
      ) : orderQuery.isError && !data ? (
        <EmptyState
          title="Order not found"
          description="Check the UUID or retry."
          aria-label="Order detail error"
          actionLabel="Retry"
          onAction={() => {
            void orderQuery.refetch();
          }}
        />
      ) : data ? (
        <>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: tokens.spacing.sm,
              padding: tokens.spacing.md,
              border: `1px solid ${tokens.color.border}`,
              borderRadius: tokens.radius.md,
              background: tokens.color.surface,
            }}
          >
            <Text as="h2" variant="heading2">
              {data.orderNumber}
            </Text>
            <Text as="p" variant="body">
              Status: {data.status}
            </Text>
            <Text as="p" variant="body">
              Total: {formatMoneyInr(data.totalAmount)}
            </Text>
            <Text as="p" variant="caption" color={tokens.color.textSecondary}>
              Order ID {data.orderId}
            </Text>
            <Text as="p" variant="caption" color={tokens.color.textSecondary}>
              Restaurant {data.restaurantId ?? '—'} · Customer{' '}
              {data.customerId ?? '—'}
            </Text>
            <Text as="p" variant="caption" color={tokens.color.textSecondary}>
              Subtotal {formatMoneyInr(data.subtotal)} · Delivery{' '}
              {formatMoneyInr(data.deliveryFee)} · Discount{' '}
              {formatMoneyInr(data.discountAmount)} · Tax{' '}
              {formatMoneyInr(data.taxAmount)}
            </Text>
            {data.placedAt ? (
              <Text as="p" variant="caption" color={tokens.color.textSecondary}>
                Placed {new Date(data.placedAt).toLocaleString()}
              </Text>
            ) : null}
          </div>

          {canOverride ? (
            <div>
              <Button
                label="Override status"
                aria-label="Override order status"
                disabled={!isConnected || overrideState.isLoading}
                onClick={() => setOverrideOpen(true)}
              />
            </div>
          ) : null}

          <DataTableShell
            caption="Line items"
            headers={['Item', 'Qty', 'Unit', 'Line total']}
          >
            {(data.items ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: tokens.spacing.md }}>
                  <Text as="span" variant="caption" color={tokens.color.textSecondary}>
                    No items.
                  </Text>
                </td>
              </tr>
            ) : (
              (data.items ?? []).map((item, index) => (
                <tr key={`${item.menuItemId ?? 'i'}-${index}`}>
                  <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
                    {item.name}
                  </td>
                  <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
                    {formatMoneyInr(item.unitPrice)}
                  </td>
                  <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
                    {formatMoneyInr(item.lineTotal)}
                  </td>
                </tr>
              ))
            )}
          </DataTableShell>

          <DataTableShell
            caption="Status events"
            headers={['From', 'To', 'Actor', 'Reason', 'At']}
          >
            {(data.orderStatusEvents ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: tokens.spacing.md }}>
                  <Text as="span" variant="caption" color={tokens.color.textSecondary}>
                    No status events.
                  </Text>
                </td>
              </tr>
            ) : (
              (data.orderStatusEvents ?? []).map((event, index) => (
                <tr key={event.eventId ?? `e-${index}`}>
                  <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
                    {event.fromStatus ?? '—'}
                  </td>
                  <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
                    {event.toStatus ?? '—'}
                  </td>
                  <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
                    {event.actorType ?? '—'}
                  </td>
                  <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
                    {event.reason ?? '—'}
                  </td>
                  <td style={{ padding: tokens.spacing.md, borderBottom: `1px solid ${tokens.color.border}` }}>
                    {event.createdAt
                      ? new Date(event.createdAt).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </DataTableShell>
        </>
      ) : null}

      <OverrideStatusModal
        open={overrideOpen}
        loading={overrideState.isLoading}
        currentStatus={data?.status}
        onClose={() => setOverrideOpen(false)}
        onConfirm={(targetStatus, reason) => {
          void onOverride(targetStatus, reason);
        }}
      />

      <Toast
        open={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        aria-label={toast?.message ?? 'Toast'}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
