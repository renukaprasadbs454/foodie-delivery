import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Text, useTheme } from 'foodie-shared-rn';
import type { OrderSummary } from '../types';
import { formatMoney } from '../types';

type Props = {
  order: OrderSummary;
  onPress: () => void;
};

const BRAND_PRIMARY = '#14532D';
const BRAND_ACCENT = '#F59E0B';

export function OrderQueueItem({ order, onPress }: Props) {
  const { tokens } = useTheme();

  const isPending = ['CONFIRMED', 'PENDING'].includes(order.status);
  const isPreparing = order.status === 'PREPARING';
  const isReady = order.status === 'READY_FOR_PICKUP' || order.status === 'DELIVERED';

  const accentColor = isPending
    ? BRAND_ACCENT
    : isPreparing
      ? '#2563EB'
      : isReady
        ? '#16A34A'
        : tokens.color.border;

  const tone = isPending
    ? 'warning'
    : isPreparing
      ? 'accent'
      : isReady
        ? 'success'
        : 'accent';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Order ${order.orderNumber}, status ${order.status}`}
      style={{
        padding: tokens.spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isPending ? BRAND_ACCENT : tokens.color.border,
        borderLeftWidth: 5,
        borderLeftColor: accentColor,
        backgroundColor: tokens.color.surface,
        gap: tokens.spacing.xs,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.xs }}>
          <Text variant="label" style={{ fontSize: 16, color: BRAND_PRIMARY, fontWeight: 'bold' }}>
            {order.orderNumber}
          </Text>
          {isPending ? (
            <View
              style={{
                backgroundColor: '#FEF3C7',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}
            >
              <Text variant="caption" style={{ color: '#B45309', fontWeight: 'bold', fontSize: 10 }}>
                ACTION NEEDED
              </Text>
            </View>
          ) : null}
        </View>

        <Badge
          label={order.status}
          tone={tone}
          accessibilityLabel={`Status ${order.status}`}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 2,
        }}
      >
        <Text variant="body" color={tokens.color.textSecondary} style={{ fontSize: 14 }}>
          {order.placedAt ? new Date(order.placedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Recent'}
        </Text>

        <Text variant="label" style={{ fontSize: 16, color: BRAND_PRIMARY, fontWeight: 'bold' }}>
          {formatMoney(order.totalAmount)}
        </Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginTop: tokens.spacing.xs,
          paddingTop: tokens.spacing.xs,
          borderTopWidth: 1,
          borderTopColor: tokens.color.border,
        }}
      >
        <Text variant="label" style={{ color: BRAND_PRIMARY, fontSize: 13 }}>
          Manage Order →
        </Text>
      </View>
    </Pressable>
  );
}

