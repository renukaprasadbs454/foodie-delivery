import React from 'react';
import { View } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';

const STEPS = ['KYC', 'Pending'] as const;

type Props = {
  activeIndex: number;
};

/** Simple step indicator — UI-API Stepper. */
export function KycStepper({ activeIndex }: Props) {
  const { tokens } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: tokens.spacing.sm,
        marginBottom: tokens.spacing.md,
      }}
      accessibilityLabel={`KYC step ${activeIndex + 1} of ${STEPS.length}`}
    >
      {STEPS.map((label, index) => {
        const active = index === activeIndex;
        const done = index < activeIndex;
        return (
          <View
            key={label}
            style={{
              paddingHorizontal: tokens.spacing.sm,
              paddingVertical: tokens.spacing.xs,
              borderRadius: tokens.radius.sm,
              backgroundColor:
                active || done ? tokens.color.accent : tokens.color.surface,
              borderWidth: 1,
              borderColor: tokens.color.border,
            }}
          >
            <Text
              variant="caption"
              color={
                active || done
                  ? tokens.color.textInverse
                  : tokens.color.textSecondary
              }
            >
              {index + 1}. {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
