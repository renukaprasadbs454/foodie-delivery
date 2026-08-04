import React from 'react';
import { Pressable, View } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';

type Props = {
  value: number;
  onChange?: (value: number) => void;
  label: string;
  accessibilityLabel: string;
  /** When false, display-only. */
  editable?: boolean;
};

/** 1–5 star control — UI-API StarRating. */
export function StarRating({
  value,
  onChange,
  label,
  accessibilityLabel,
  editable = true,
}: Props) {
  const { tokens } = useTheme();

  return (
    <View style={{ gap: tokens.spacing.xs }}>
      <Text variant="label">{label}</Text>
      <View
        style={{ flexDirection: 'row', gap: tokens.spacing.sm }}
        accessibilityLabel={accessibilityLabel}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const selected = star <= value;
          return (
            <Pressable
              key={star}
              disabled={!editable || !onChange}
              onPress={() => onChange?.(star)}
              accessibilityRole={editable ? 'button' : 'text'}
              accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
              accessibilityState={{ selected }}
              style={{
                width: 48,
                height: 48,
                borderRadius: tokens.radius.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected
                  ? tokens.color.accent
                  : tokens.color.surface,
                borderWidth: 1,
                borderColor: tokens.color.border,
              }}
            >
              <Text
                variant="label"
                color={
                  selected
                    ? tokens.color.textInverse
                    : tokens.color.textSecondary
                }
              >
                {star}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
