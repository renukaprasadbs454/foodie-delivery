import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
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
import { toUnwrappedApiError } from '../apiError';
import { isValidDeliveryPhone, normalizeDeliveryPhone } from '../phone';
import { applyAuthSession } from '../session';
import { useAppDispatch } from '../../../store/hooks';

const RESEND_COOLDOWN_SEC = 30;

type Step = 'phone' | 'otp';

/**
 * P2-AUTH-03 Login — OTP request + verify on one screen (UI-API Delivery Login).
 * No Google.
 */
export function LoginScreen() {
  const { tokens } = useTheme();
  const dispatch = useAppDispatch();
  const { isConnected } = useConnectivity();
  const [step, setStep] = useState<Step>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [otpError, setOtpError] = useState<string | undefined>();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'error' | 'info' | 'success';
  } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [requestOtp, requestState] = useRequestOtpMutation();
  const [verifyOtp, verifyState] = useVerifyOtpMutation();

  const showError = useCallback((message: string) => {
    setToast({ message, variant: 'error' });
  }, []);

  const handleApiError = useApiErrorHandler({
    onInlineField: (error) => {
      if (error.fields?.phoneNumber) setPhoneError(error.fields.phoneNumber);
      else if (error.fields?.otp) setOtpError(error.fields.otp);
      else showError(error.message);
      if (error.code === 'RATE_LIMITED') setCooldown(RESEND_COOLDOWN_SEC);
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
    trackAnalyticsEvent('delivery_login_viewed');
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => {
      setCooldown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const onRequestOtp = async () => {
    setPhoneError(undefined);
    if (!isConnected) {
      showError('You are offline. Connect to request an OTP.');
      return;
    }
    const normalized = normalizeDeliveryPhone(phoneInput);
    if (!isValidDeliveryPhone(normalized)) {
      setPhoneError('Enter a valid Indian mobile number (+91).');
      return;
    }
    trackAnalyticsEvent('otp_request_tapped');
    try {
      await requestOtp({ phoneNumber: normalized }).unwrap();
      trackAnalyticsEvent('auth_otp_requested');
      setPhoneNumber(normalized);
      setStep('otp');
      setCooldown(RESEND_COOLDOWN_SEC);
      setOtp('');
      setOtpError(undefined);
    } catch (err) {
      handleApiError(toUnwrappedApiError(err));
    }
  };

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
        userType: 'DELIVERY_PARTNER',
      }).unwrap();
      trackAnalyticsEvent('auth_otp_verified');
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
    trackAnalyticsEvent('otp_request_tapped');
    try {
      await requestOtp({ phoneNumber }).unwrap();
      setCooldown(RESEND_COOLDOWN_SEC);
      setToast({ message: 'A new code was sent.', variant: 'success' });
    } catch (err) {
      handleApiError(toUnwrappedApiError(err));
    }
  };

  const busy = requestState.isLoading || verifyState.isLoading;

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
        Delivery partner sign in
      </Text>
      {step === 'phone' ? (
        <>
          <Text variant="body" color={tokens.color.textSecondary}>
            Enter your mobile number to receive a one-time code. OTP only — no
            Google or password login.
          </Text>
          <TextInput
            label="Mobile number"
            accessibilityLabel="Mobile number"
            value={phoneInput}
            onChangeText={setPhoneInput}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="+9198XXXXXXXX"
            errorText={phoneError}
            editable={!busy}
          />
          <Button
            label="Send OTP"
            accessibilityLabel="Send OTP"
            loading={requestState.isLoading}
            disabled={busy}
            onPress={() => {
              void onRequestOtp();
            }}
          />
        </>
      ) : (
        <>
          <Text variant="body" color={tokens.color.textSecondary}>
            Enter the 6-digit code sent to your phone.
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
            loading={requestState.isLoading}
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
            onPress={() => {
              setStep('phone');
              setOtp('');
              setOtpError(undefined);
            }}
          />
        </>
      )}
      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel="Login message"
        onDismiss={() => setToast(null)}
      />
    </View>
  );
}
