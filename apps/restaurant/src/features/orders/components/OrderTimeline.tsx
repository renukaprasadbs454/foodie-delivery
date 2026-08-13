import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';

type Props = {
  status: string;
};

const STEPS = [
  { key: 'CONFIRMED', label: 'Confirmed', icon: '⏳' },
  { key: 'ACCEPTED', label: 'Accepted', icon: '👍' },
  { key: 'PREPARING', label: 'Preparing', icon: '🍳' },
  { key: 'READY_FOR_PICKUP', label: 'Ready', icon: '📦' },
  { key: 'DELIVERED', label: 'Delivered', icon: '✅' },
];

const BRAND_PRIMARY = '#14532D'; // Dark Green
const BRAND_ACCENT = '#F59E0B';  // Gold

export function OrderTimeline({ status }: Props) {
  const { tokens } = useTheme();
  const normalized = (status || '').toUpperCase();

  const isRejected = ['REJECTED', 'CANCELLED'].includes(normalized);

  let activeIndex = -1;
  switch (normalized) {
    case 'CONFIRMED':
    case 'PENDING':
      activeIndex = 0;
      break;
    case 'ACCEPTED':
      activeIndex = 1;
      break;
    case 'PREPARING':
      activeIndex = 2;
      break;
    case 'READY_FOR_PICKUP':
      activeIndex = 3;
      break;
    case 'DELIVERED':
    case 'COMPLETED':
      activeIndex = 4;
      break;
    default:
      activeIndex = -1;
      break;
  }

  if (isRejected) {
    return (
      <View
        style={{
          padding: tokens.spacing.md,
          backgroundColor: '#FEF2F2',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#FCA5A5',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Text variant="label" style={{ color: '#DC2626', fontWeight: 'bold' }}>
          ❌ Order {normalized === 'CANCELLED' ? 'Cancelled' : 'Rejected'}
        </Text>
        <Text variant="caption" color={tokens.color.textSecondary}>
          This order was cancelled or rejected and is no longer active in the kitchen queue.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: tokens.spacing.xs, paddingVertical: tokens.spacing.xs }}>
      <Text variant="label" style={{ color: BRAND_PRIMARY, fontSize: 14 }}>
        Order Progress Timeline
      </Text>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: tokens.spacing.sm,
          paddingHorizontal: 4,
        }}
      >
        {STEPS.map((step, idx) => {
          const isPassed = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const isUpcoming = idx > activeIndex;

          const circleBg = isCurrent
            ? BRAND_PRIMARY
            : isPassed
              ? '#DCFCE7'
              : '#F1F5F9';

          const textColor = isCurrent
            ? BRAND_PRIMARY
            : isPassed
              ? '#16A34A'
              : '#94A3B8';

          const borderColor = isCurrent
            ? BRAND_ACCENT
            : isPassed
              ? BRAND_PRIMARY
              : '#CBD5E1';

          return (
            <React.Fragment key={step.key}>
              {/* Step Circle & Label */}
              <View style={{ alignItems: 'center', flex: 1, gap: 4 }}>
                <View
                  style={{
                    width: isCurrent ? 36 : 30,
                    height: isCurrent ? 36 : 30,
                    borderRadius: 18,
                    backgroundColor: circleBg,
                    borderWidth: isCurrent ? 2 : 1,
                    borderColor: borderColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: isCurrent ? BRAND_PRIMARY : 'transparent',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: isCurrent ? 3 : 0,
                  }}
                >
                  <Text style={{ fontSize: isCurrent ? 16 : 13 }}>{step.icon}</Text>
                </View>
                <Text
                  variant="caption"
                  style={{
                    color: textColor,
                    fontWeight: isCurrent ? 'bold' : isPassed ? '600' : 'normal',
                    fontSize: isCurrent ? 11 : 10,
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>

              {/* Connecting Line */}
              {idx < STEPS.length - 1 ? (
                <View
                  style={{
                    height: 3,
                    flex: 1,
                    marginHorizontal: -4,
                    marginTop: -16,
                    backgroundColor: idx < activeIndex ? BRAND_PRIMARY : '#E2E8F0',
                    borderRadius: 1.5,
                  }}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}
