import React from 'react';
import { View } from 'react-native';
import {
  Text,
  getOrderStatusColorRole,
  useTheme,
  type OrderStatus,
} from 'foodie-shared-rn';
import { TRACKING_STEPPER_STATUSES, isTerminalOrderStatus } from '../types';

type Props = {
  status: string;
};

// Helpful status tag descriptions
const STATUS_DESCRIPTIONS: Record<string, string> = {
  PLACED: 'Your order has been received by the merchant',
  MERCHANT_CONFIRMED: 'Restaurant is reviewing your order details',
  PREPARING: 'Chef is crafting your delicious meal',
  READY_FOR_PICKUP: 'Freshly packed food is waiting at counter',
  DISPATCHED: 'Rider picked up food and is heading to you',
  DELIVERED: 'Meal delivered successfully! Bon appétit!',
};

function statusIndex(status: string): number {
  return TRACKING_STEPPER_STATUSES.indexOf(status as OrderStatus);
}

export function OrderStatusStepper({ status }: Props) {
  const { tokens } = useTheme();
  const current = statusIndex(status);
  const terminalFail = status === 'CANCELLED' || status === 'REJECTED';

  if (terminalFail || (isTerminalOrderStatus(status) && status !== 'DELIVERED')) {
    const role =
      status === 'CANCELLED' || status === 'REJECTED'
        ? getOrderStatusColorRole(status as OrderStatus)
        : 'textSecondary';
    return (
      <View
        style={{
          padding: tokens.spacing.lg,
          borderRadius: tokens.radius.lg,
          backgroundColor: '#FFF1F2', // Soft red bg
          borderWidth: 1,
          borderColor: '#FECDD3',
        }}
        accessibilityLabel={`Order status ${status}`}
      >
        <Text variant="heading2" style={{ color: '#E11D48', fontWeight: '900' }}>
          {status}
        </Text>
        <Text variant="bodySmall" color={tokens.color.textSecondary} style={{ marginTop: 4 }}>
          This order was cancelled or rejected. Please browse other menus.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: tokens.color.surface,
        padding: tokens.spacing.lg,
        borderRadius: tokens.radius.lg,
        borderWidth: 1,
        borderColor: tokens.color.border,
        gap: tokens.spacing.sm,
      }}
      accessibilityLabel={`Order status stepper, current ${status}`}
    >
      {TRACKING_STEPPER_STATUSES.map((step, index) => {
        const reached = current >= 0 && index <= current;
        const isCurrent = step === status;
        const color = reached
          ? tokens.color[getOrderStatusColorRole(step)]
          : tokens.color.border;

        return (
          <View
            key={step}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: tokens.spacing.md,
            }}
          >
            {/* Left timeline line and dot */}
            <View style={{ alignItems: 'center', width: 20 }}>
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: color,
                  borderWidth: isCurrent ? 3 : 0,
                  borderColor: isCurrent ? tokens.color.accentMuted : 'transparent', // Gold halo for active step
                  zIndex: 2,
                }}
              />
              {index < TRACKING_STEPPER_STATUSES.length - 1 ? (
                <View
                  style={{
                    width: 2,
                    height: 38,
                    backgroundColor: current >= 0 && index < current ? tokens.color.accent : tokens.color.border,
                    marginTop: -2,
                    zIndex: 1,
                  }}
                />
              ) : null}
            </View>

            {/* Right text labels */}
            <View style={{ flex: 1, marginTop: -2, paddingBottom: index < TRACKING_STEPPER_STATUSES.length - 1 ? 16 : 0 }}>
              <Text
                variant={isCurrent ? 'label' : 'bodySmall'}
                style={{
                  fontWeight: isCurrent ? '800' : '600',
                  color: isCurrent ? tokens.color.accent : reached ? tokens.color.textPrimary : tokens.color.textSecondary,
                }}
              >
                {step.replace(/_/g, ' ')}
              </Text>
              {isCurrent && STATUS_DESCRIPTIONS[step] ? (
                <Text
                  variant="caption"
                  color={tokens.color.textSecondary}
                  style={{ marginTop: 2, lineHeight: 14 }}
                >
                  {STATUS_DESCRIPTIONS[step]}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

