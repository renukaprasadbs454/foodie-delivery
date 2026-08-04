import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Text, useTheme } from 'foodie-shared-rn';
import type { OrderSummary } from '../types';
import { formatMoney } from '../types';

type Props = {
  order: OrderSummary;
  onPress: () => void;
};

export function OrderQueueItem({ order, onPress }: Props) {
  const { tokens } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.orderNumber}, status ${order.status}`}
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
        <Badge
          label={order.status}
          tone="accent"
          accessibilityLabel={`Status ${order.status}`}
        />
      </View>
      <Text variant="body" color={tokens.color.textSecondary}>
        {formatMoney(order.totalAmount)}
        {order.placedAt ? ` · ${new Date(order.placedAt).toLocaleString()}` : ''}
      </Text>
    </Pressable>
  );
}
