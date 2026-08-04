import React, { type ReactNode } from 'react';
import {
  Modal as RNModal,
  Pressable,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Text } from './Text';

export type ModalProps = {
  visible: boolean;
  onRequestClose: () => void;
  title?: string;
  children: ReactNode;
  accessibilityLabel: string;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Modal({
  visible,
  onRequestClose,
  title,
  children,
  accessibilityLabel,
  contentStyle,
}: ModalProps) {
  const { tokens } = useTheme();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      accessibilityViewIsModal
    >
      <Pressable
        onPress={onRequestClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss dialog"
        style={{
          flex: 1,
          backgroundColor: tokens.color.overlay,
          justifyContent: 'center',
          padding: tokens.spacing.lg,
        }}
      >
        <Pressable
          accessibilityLabel={accessibilityLabel}
          onPress={() => undefined}
          style={[
            {
              backgroundColor: tokens.color.background,
              borderRadius: tokens.radius.lg,
              padding: tokens.spacing.lg,
              gap: tokens.spacing.md,
            },
            contentStyle,
          ]}
        >
          {title ? <Text variant="heading2">{title}</Text> : null}
          <View>{children}</View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
