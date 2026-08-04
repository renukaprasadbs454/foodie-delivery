import React from 'react';
import { View } from 'react-native';
import { Button, Text, TextInput, useTheme } from 'foodie-shared-rn';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onApply: () => void;
  applying?: boolean;
  disabled?: boolean;
  previewLabel?: string | null;
};

/** UI-API CouponField — apply is preview only (P2-CUS-04). */
export function CouponField({
  value,
  onChangeText,
  onApply,
  applying,
  disabled,
  previewLabel,
}: Props) {
  const { tokens } = useTheme();
  return (
    <View style={{ gap: tokens.spacing.sm }}>
      <TextInput
        label="Coupon code"
        accessibilityLabel="Coupon code"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={30}
        editable={!disabled}
      />
      <Button
        label="Apply coupon"
        accessibilityLabel="Apply coupon preview"
        variant="secondary"
        loading={applying}
        disabled={disabled || applying}
        onPress={onApply}
      />
      {previewLabel ? (
        <Text variant="bodySmall" color={tokens.color.success}>
          {previewLabel}
        </Text>
      ) : (
        <Text variant="caption" color={tokens.color.textSecondary}>
          Coupon apply is a preview only — final discount is confirmed when you
          place the order.
        </Text>
      )}
    </View>
  );
}
