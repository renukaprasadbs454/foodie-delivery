import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Modal, Text, TextInput, useTheme } from 'foodie-shared-rn';
import { validateRejectReason } from '../types';

type Props = {
  visible: boolean;
  orderNumber?: string;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

const COMMON_REASONS = [
  'Item unavailable',
  'Restaurant too busy',
  'Kitchen closed',
  'Delivery unavailable',
  'Other',
] as const;

const BRAND_PRIMARY = '#14532D';

export function RejectOrderModal({
  visible,
  orderNumber,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  const { tokens } = useTheme();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  const finalReason =
    selectedReason === 'Other' || !selectedReason
      ? customReason
      : selectedReason;

  const validation = validateRejectReason(finalReason);
  const isValid = validation.ok;

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(finalReason.trim());
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={handleClose}
      title="Reject Order?"
      accessibilityLabel="Reject Order Confirmation Modal"
    >
      <View style={{ gap: tokens.spacing.md }}>
        <Text variant="body" color={tokens.color.textSecondary}>
          Please provide a reason for rejecting order{' '}
          <Text variant="label" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
            {orderNumber ?? ''}
          </Text>
          .
        </Text>

        <View style={{ gap: tokens.spacing.xs }}>
          <Text variant="label" color={tokens.color.textPrimary}>
            Select Reason
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.xs }}>
            {COMMON_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <Pressable
                  key={reason}
                  onPress={() => {
                    setSelectedReason(reason);
                    if (reason !== 'Other') {
                      setCustomReason(reason);
                    } else {
                      setCustomReason('');
                    }
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Reason ${reason}`}
                  style={{
                    paddingHorizontal: tokens.spacing.sm,
                    paddingVertical: tokens.spacing.xs,
                    borderRadius: tokens.radius.full,
                    borderWidth: 1,
                    borderColor: isSelected ? '#DC2626' : tokens.color.border,
                    backgroundColor: isSelected ? '#FEF2F2' : tokens.color.surface,
                  }}
                >
                  <Text
                    variant="caption"
                    style={{
                      color: isSelected ? '#DC2626' : tokens.color.textPrimary,
                      fontWeight: isSelected ? 'bold' : 'normal',
                    }}
                  >
                    {reason}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {(selectedReason === 'Other' || !selectedReason) ? (
          <TextInput
            label="Custom Reason *"
            value={customReason}
            onChangeText={setCustomReason}
            placeholder="Type reason here..."
            accessibilityLabel="Custom reject reason"
            multiline
          />
        ) : null}

        <View style={{ flexDirection: 'row', gap: tokens.spacing.sm, justifyContent: 'flex-end', marginTop: tokens.spacing.xs }}>
          <Button
            label="Cancel"
            variant="secondary"
            accessibilityLabel="Cancel rejection"
            onPress={handleClose}
          />
          <Button
            label="Confirm Reject"
            accessibilityLabel="Confirm reject order"
            loading={loading}
            disabled={!isValid}
            style={{
              backgroundColor: isValid ? '#DC2626' : '#9CA3AF',
            }}
            onPress={handleConfirm}
          />
        </View>
      </View>
    </Modal>
  );
}
