import React from 'react';
import { Pressable, View } from 'react-native';
import {
  Text,
  getOrderStatusColorRole,
  useTheme,
  type OrderStatus,
} from 'foodie-shared-rn';
import { formatMoney } from '../../menu/types';
import type { OrderSummary } from '../types';

type Props = {
  order: OrderSummary;
  onPress: () => void;
};

function isKnownStatus(status: string): status is OrderStatus {
  return (
    status === 'PLACED' ||
    status === 'CONFIRMED' ||
    status === 'ACCEPTED' ||
    status === 'PREPARING' ||
    status === 'READY_FOR_PICKUP' ||
    status === 'ASSIGNED' ||
    status === 'PICKED_UP' ||
    status === 'OUT_FOR_DELIVERY' ||
    status === 'DELIVERED' ||
    status === 'REJECTED' ||
    status === 'CANCELLED'
  );
}

/** My Orders row — UI-API OrderListItem. */
export function OrderListItem({ order, onPress }: Props) {
  const { tokens } = useTheme();
  const statusColor = isKnownStatus(order.status)
    ? tokens.color[getOrderStatusColorRole(order.status)]
    : tokens.color.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.orderNumber}, ${order.status}`}
      style={{
        padding: tokens.spacing.md,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: tokens.color.border,
        backgroundColor: tokens.color.surface,
        gap: tokens.spacing.xs,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text variant="label">{order.orderNumber}</Text>
        <Text variant="label" color={statusColor}>
          {order.status}
        </Text>
      </View>
      <Text variant="body">{formatMoney(order.totalAmount)}</Text>
      {order.placedAt ? (
        <Text variant="caption" color={tokens.color.textSecondary}>
          {new Date(order.placedAt).toLocaleString()}
        </Text>
      ) : null}
    </Pressable>
  );
}
