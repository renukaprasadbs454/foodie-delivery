import React from 'react';
import { View } from 'react-native';
import { Button, Card, Text, useTheme } from 'foodie-shared-rn';

type Props = {
  statusFilter?: string;
  onRefresh?: () => void;
  isFetching?: boolean;
};

const BRAND_PRIMARY = '#14532D';

export function EmptyOrdersState({ statusFilter, onRefresh, isFetching }: Props) {
  const { tokens } = useTheme();

  const title = !statusFilter
    ? 'No Active Orders'
    : statusFilter === 'CONFIRMED'
      ? 'No Confirmed Orders'
      : statusFilter === 'ACCEPTED'
        ? 'No Accepted Orders'
        : statusFilter === 'PREPARING'
          ? 'No Orders in Preparation'
          : statusFilter === 'READY_FOR_PICKUP'
            ? 'No Orders Ready for Pickup'
            : statusFilter === 'DELIVERED'
              ? 'No Delivered Orders'
              : statusFilter === 'REJECTED'
                ? 'No Rejected Orders'
                : 'No Orders Found';

  const description = !statusFilter
    ? 'New customer orders will appear here in real time as soon as they are placed.'
    : `No orders currently match status "${statusFilter}". New incoming orders will appear automatically.`;

  return (
    <Card
      style={{
        padding: tokens.spacing.xl,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: tokens.spacing.sm,
        backgroundColor: tokens.color.surface,
        borderColor: tokens.color.border,
        borderWidth: 1,
        marginVertical: tokens.spacing.md,
      }}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: '#F1F5F9',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        <Text style={{ fontSize: 28 }}>📦</Text>
      </View>

      <Text
        variant="heading2"
        style={{ color: BRAND_PRIMARY, textAlign: 'center', fontSize: 18 }}
      >
        {title}
      </Text>

      <Text
        variant="body"
        color={tokens.color.textSecondary}
        style={{ textAlign: 'center', maxWidth: 360, fontSize: 14 }}
      >
        {description}
      </Text>

      {onRefresh ? (
        <Button
          label="🔄 Refresh Orders Queue"
          accessibilityLabel="Refresh orders queue"
          variant="secondary"
          loading={isFetching}
          onPress={onRefresh}
          style={{ marginTop: tokens.spacing.xs }}
        />
      ) : null}
    </Card>
  );
}
