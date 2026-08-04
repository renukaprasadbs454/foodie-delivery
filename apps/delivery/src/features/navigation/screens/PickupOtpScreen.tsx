import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useVerifyPickupOtpMutation } from '../../../api/endpoints/deliveryApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { validateOtp } from '../types';
import type { MainStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'PickupOtp'>;

/**
 * P2-DEL-03 — POST /delivery/assignments/{id}/verify-pickup.
 * Offline OTP blocked (SD §12.2). Never log/display server OTP.
 */
export function PickupOtpScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const { assignmentId, orderId } = route.params;
  const [otp, setOtp] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [verify, verifyState] = useVerifyPickupOtpMutation();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onInlineField: (error) => {
      setFieldError(error.message);
      setToast({ message: error.message, variant: 'error' });
    },
    onFullScreen: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) => setToast({ message: error.message, variant: 'error' }),
  });

  useEffect(() => {
    trackAnalyticsEvent('delivery_pickup_otp_viewed');
  }, []);

  const onSubmit = async () => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to verify pickup OTP.',
        variant: 'warning',
      });
      return;
    }
    const validated = validateOtp(otp);
    if (!validated.ok) {
      setFieldError(validated.message);
      return;
    }
    setFieldError(undefined);
    trackAnalyticsEvent('pickup_otp_submitted');
    try {
      await verify({ assignmentId, orderId, otp: validated.otp }).unwrap();
      trackAnalyticsEvent('pickup_verified', { orderId });
      setToast({ message: 'Pickup verified.', variant: 'success' });
      navigation.replace('DeliveryNavigation', {
        assignmentId,
        orderId,
        leg: 'drop',
      });
    } catch (error) {
      setOtp('');
      handleError(toUnwrappedApiError(error));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 48,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="heading1" accessibilityRole="header">
          Pickup OTP
        </Text>
        <Text variant="body" color={tokens.color.textSecondary}>
          Enter the 6-digit code from the restaurant. OTP is never shown by the
          app.
        </Text>
        {!isConnected ? (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — pickup OTP verification is blocked.
          </Text>
        ) : null}
        <TextInput
          label="OTP"
          accessibilityLabel="Pickup OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          errorText={fieldError}
          editable={isConnected && !verifyState.isLoading}
        />
        <Button
          label="Verify pickup"
          accessibilityLabel="Verify pickup OTP"
          loading={verifyState.isLoading}
          disabled={!isConnected}
          onPress={() => {
            void onSubmit();
          }}
          style={{ minHeight: 48 }}
        />
      </ScrollView>
      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast'}
        onDismiss={() => setToast(null)}
      />
    </View>
  );
}
