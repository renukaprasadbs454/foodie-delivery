import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';
import { formatMoney } from '../../menu/types';
import type { OrderDetail } from '../types';

type Props = {
  order: OrderDetail;
};

/** Order Success / tracking summary — UI-API OrderSummaryCard. */
export function OrderSummaryCard({ order }: Props) {
  const { tokens } = useTheme();
  const items = order.items ?? [];

  return (
    <View
      style={{
        gap: tokens.spacing.sm,
        padding: tokens.spacing.md,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: tokens.color.border,
        backgroundColor: tokens.color.surface,
      }}
      accessibilityLabel={`Order summary ${order.orderNumber}`}
    >
      <Text variant="heading2">{order.orderNumber}</Text>
      <Text variant="label" color={tokens.color.textSecondary}>
        Status: {order.status}
      </Text>
      {items.length > 0 ? (
        <View style={{ gap: tokens.spacing.xs, marginTop: tokens.spacing.sm }}>
          {items.map((item, index) => (
            <Text
              key={`${item.menuItemId ?? 'item'}-${index}`}
              variant="body"
            >
              {item.quantity}× {item.name ?? 'Item'}
              {item.lineTotal != null ? ` · ${formatMoney(item.lineTotal)}` : ''}
            </Text>
          ))}
        </View>
      ) : null}
      <View style={{ marginTop: tokens.spacing.sm, gap: tokens.spacing.xs }}>
        <Text variant="caption" color={tokens.color.textSecondary}>
          Subtotal {formatMoney(order.subtotal)} · Delivery{' '}
          {formatMoney(order.deliveryFee)} · Discount{' '}
          {formatMoney(order.discountAmount)} · Tax {formatMoney(order.taxAmount)}
        </Text>
        <Text variant="label">Total {formatMoney(order.totalAmount)}</Text>
      </View>
    </View>
  );
}
