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

function statusIndex(status: string): number {
  const idx = TRACKING_STEPPER_STATUSES.indexOf(status as OrderStatus);
  return idx;
}

/** Live status stepper — UI-API OrderStatusStepper. */
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
          padding: tokens.spacing.md,
          borderRadius: tokens.radius.md,
          backgroundColor: tokens.color.surface,
          borderWidth: 1,
          borderColor: tokens.color.border,
        }}
        accessibilityLabel={`Order status ${status}`}
      >
        <Text variant="heading2" color={tokens.color[role]}>
          {status}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{ gap: tokens.spacing.sm }}
      accessibilityLabel={`Order status stepper, current ${status}`}
    >
      {TRACKING_STEPPER_STATUSES.map((step, index) => {
        const reached = current >= 0 && index <= current;
        const isCurrent = step === status;
        const color = reached
          ? tokens.color[getOrderStatusColorRole(step)]
          : tokens.color.textSecondary;
        return (
          <View
            key={step}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: tokens.spacing.sm,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: color,
                opacity: reached ? 1 : 0.35,
              }}
            />
            <Text
              variant={isCurrent ? 'label' : 'body'}
              color={color}
              style={{ opacity: reached ? 1 : 0.55 }}
            >
              {step}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
