import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  OTP_REGEX,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useRequestOtpMutation,
  useVerifyOtpMutation,
} from '../../../api/endpoints/authApi';
import type { AuthStackParamList } from '../../../navigation/types';
import { toUnwrappedApiError } from '../apiError';
import { applyAuthSession } from '../session';
import { useAppDispatch } from '../../../store/hooks';

type Props = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

const RESEND_COOLDOWN_SEC = 30;

/**
 * P2-AUTH-01 OTP Verification — UI-API OtpVerification.
 * Always sends userType CUSTOMER for first-time path (existing type wins server-side).
 */
export function OtpVerificationScreen({ navigation, route }: Props) {
  const { phoneNumber } = route.params;
  const { tokens } = useTheme();
  const dispatch = useAppDispatch();
  const { isConnected } = useConnectivity();
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | undefined>();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'error' | 'info' | 'success';
  } | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SEC);
  const [verifyOtp, verifyState] = useVerifyOtpMutation();
  const [requestOtp, resendState] = useRequestOtpMutation();

  const showError = useCallback((message: string) => {
    setToast({ message, variant: 'error' });
  }, []);

  const handleApiError = useApiErrorHandler({
    onInlineField: (error) => {
      const fieldMsg = error.fields?.otp;
      if (fieldMsg) setOtpError(fieldMsg);
      else showError(error.message);
      if (error.code === 'RATE_LIMITED') {
        setCooldown(RESEND_COOLDOWN_SEC);
      }
    },
    onToast: (error) => {
      showError(error.message);
      if (error.code === 'RATE_LIMITED') setCooldown(RESEND_COOLDOWN_SEC);
    },
    onForceLogout: (error) => showError(error.message),
    onFullScreen: (error) => showError(error.message),
    onModalBlocking: (error) => showError(error.message),
    onGeneric: (error) => showError(error.message),
  });

  useEffect(() => {
    trackAnalyticsEvent('customer_otp_viewed');
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const onVerify = async () => {
    setOtpError(undefined);
    if (!isConnected) {
      showError('You are offline. Connect to verify the OTP.');
      return;
    }
    if (!OTP_REGEX.test(otp)) {
      setOtpError('Enter the 6-digit code.');
      return;
    }
    trackAnalyticsEvent('otp_submitted');
    try {
      const data = await verifyOtp({
        phoneNumber,
        otp,
        userType: 'CUSTOMER',
      }).unwrap();
      trackAnalyticsEvent(
        data.isNewUser ? 'auth_signup_completed' : 'auth_otp_verified',
      );
      await applyAuthSession(dispatch, data);
    } catch (err) {
      handleApiError(toUnwrappedApiError(err));
    }
  };

  const onResend = async () => {
    if (!isConnected) {
      showError('You are offline. Connect to resend the OTP.');
      return;
    }
    if (cooldown > 0) return;
    trackAnalyticsEvent('otp_resend_tapped');
    try {
      await requestOtp({ phoneNumber }).unwrap();
      setCooldown(RESEND_COOLDOWN_SEC);
      setToast({ message: 'A new code was sent.', variant: 'success' });
    } catch (err) {
      handleApiError(toUnwrappedApiError(err));
    }
  };

  const busy = verifyState.isLoading || resendState.isLoading;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.color.background,
        padding: tokens.spacing.xl,
        justifyContent: 'center',
        gap: tokens.spacing.lg,
      }}
    >
      <Text variant="heading1" accessibilityRole="header">
        Enter OTP
      </Text>
      <Text variant="body" color={tokens.color.textSecondary}>
        We sent a 6-digit code to your phone.
      </Text>
      <TextInput
        label="One-time code"
        accessibilityLabel="One-time code"
        value={otp}
        onChangeText={setOtp}
        keyboardType="number-pad"
        maxLength={6}
        errorText={otpError}
        editable={!busy}
      />
      <Button
        label="Verify"
        accessibilityLabel="Verify OTP"
        loading={verifyState.isLoading}
        disabled={busy}
        onPress={() => {
          void onVerify();
        }}
      />
      <Button
        label={
          cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'
        }
        accessibilityLabel="Resend OTP"
        variant="secondary"
        loading={resendState.isLoading}
        disabled={busy || cooldown > 0}
        onPress={() => {
          void onResend();
        }}
      />
      <Button
        label="Change number"
        accessibilityLabel="Change phone number"
        variant="secondary"
        disabled={busy}
        onPress={() => navigation.navigate('Login')}
      />
      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel="OTP message"
        onDismiss={() => setToast(null)}
      />
    </View>
  );
}
