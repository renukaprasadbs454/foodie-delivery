'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  EmptyState,
  Text,
  TextInput,
  trackAnalyticsEvent,
  useTheme,
} from 'foodie-shared-web';
import {
  GAP_API_16_ORDER_LIST,
  ORDER_LIST_GAP_MESSAGE,
} from '@/constants/gaps';
import { isOrderUuid } from '../types';

/**
 * P2-ADM-04 AdminOrders — GAP-API-16 Partial shell.
 * No invent list GET. Deep-link by UUID to detail + override.
 */
export function OrdersPage() {
  const { tokens } = useTheme();
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    trackAnalyticsEvent('admin_orders_viewed', {
      gapId: GAP_API_16_ORDER_LIST,
    });
  }, []);

  const openDetails = () => {
    const id = orderId.trim();
    if (!isOrderUuid(id)) {
      setError('Enter a valid order UUID.');
      return;
    }
    setError(undefined);
    router.push(`/orders/${id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
      <Text as="h1" variant="heading1">
        Orders
      </Text>

      <EmptyState
        title="Order list unavailable"
        description={ORDER_LIST_GAP_MESSAGE}
        aria-label="Order list gap"
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing.md,
          maxWidth: 480,
          padding: tokens.spacing.md,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
        }}
      >
        <Text as="h2" variant="heading3">
          Open by UUID
        </Text>
        <Text as="p" variant="caption" color={tokens.color.textSecondary}>
          Detail + status override live on the order screen (GAP-API-16 Partial).
        </Text>
        <TextInput
          label="Order ID"
          name="orderId"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          errorText={error}
          aria-label="Order UUID"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <Button
          label="Open order"
          aria-label="Open order details"
          onClick={openDetails}
        />
      </div>
    </div>
  );
}
