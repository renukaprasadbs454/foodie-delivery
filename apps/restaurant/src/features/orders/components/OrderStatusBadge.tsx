import React from 'react';
import { View } from 'react-native';
import { Badge, Text } from 'foodie-shared-rn';

type Props = {
  status: string;
  size?: 'sm' | 'md' | 'lg';
};

export function OrderStatusBadge({ status, size = 'md' }: Props) {
  const normalized = (status || '').toUpperCase();

  let tone: 'warning' | 'accent' | 'success' | 'error' | 'info' = 'accent';
  let label = status;
  let icon = '📋';

  switch (normalized) {
    case 'CONFIRMED':
    case 'PENDING':
      tone = 'warning';
      label = 'CONFIRMED';
      icon = '⏳';
      break;
    case 'ACCEPTED':
      tone = 'accent';
      label = 'ACCEPTED';
      icon = '👍';
      break;
    case 'PREPARING':
      tone = 'accent';
      label = 'PREPARING';
      icon = '🍳';
      break;
    case 'READY_FOR_PICKUP':
      tone = 'success';
      label = 'READY FOR PICKUP';
      icon = '📦';
      break;
    case 'DELIVERED':
    case 'COMPLETED':
      tone = 'success';
      label = 'DELIVERED';
      icon = '✅';
      break;
    case 'REJECTED':
    case 'CANCELLED':
      tone = 'error';
      label = 'REJECTED';
      icon = '❌';
      break;
    default:
      tone = 'accent';
      label = status;
      icon = '🏷️';
      break;
  }

  const fontSize = size === 'sm' ? 11 : size === 'lg' ? 14 : 12;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Badge
        label={`${icon} ${label}`}
        tone={tone}
        accessibilityLabel={`Order status ${label}`}
      />
    </View>
  );
}
