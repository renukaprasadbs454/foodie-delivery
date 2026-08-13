import React from 'react';
import { Modal, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'foodie-shared-rn';

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { tokens } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onCancel}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          padding: tokens.spacing.md,
        }}
      >
        <Card style={{ padding: tokens.spacing.lg, gap: tokens.spacing.md, borderRadius: 16 }}>
          <Text
            variant="heading2"
            style={{ color: isDanger ? '#DC2626' : '#14532D', fontWeight: 'bold' }}
          >
            {title}
          </Text>

          <Text variant="body" color={tokens.color.textSecondary}>
            {message}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              gap: tokens.spacing.sm,
              justifyContent: 'flex-end',
              paddingTop: tokens.spacing.xs,
            }}
          >
            <Button
              label={cancelLabel}
              variant="secondary"
              onPress={onCancel}
              accessibilityLabel={cancelLabel}
            />
            <Button
              label={confirmLabel}
              loading={loading}
              onPress={onConfirm}
              accessibilityLabel={confirmLabel}
              style={{
                backgroundColor: isDanger ? '#DC2626' : '#14532D',
              }}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}
