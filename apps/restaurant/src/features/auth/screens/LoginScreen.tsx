import React, { useCallback, useEffect, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
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
import {
  isValidRestaurantPhone,
  normalizeRestaurantPhone,
} from '../phone';
import { applyAuthSession } from '../session';
import { useAppDispatch } from '../../../store/hooks';

const RESEND_COOLDOWN_SEC = 30;

type Step = 'phone' | 'otp';

/**
 * P2-AUTH-02 Login — OTP request + verify on one screen (UI-API Restaurant Login).
 * No separate OTP route; no Google.
 */
export function LoginScreen() {
  const { tokens } = useTheme();
  const dispatch = useAppDispatch();
  const { isConnected } = useConnectivity();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

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
    trackAnalyticsEvent('restaurant_login_viewed');
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
    const normalized = normalizeRestaurantPhone(phoneInput);
    if (!isValidRestaurantPhone(normalized)) {
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
        userType: 'RESTAURANT',
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
        backgroundColor: '#FAFAF7',
        padding: tokens.spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          padding: tokens.spacing.lg,
          gap: tokens.spacing.md,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
          borderWidth: 1,
          borderColor: '#E2E8F0',
          width: '100%',
          maxWidth: 460,
        }}
      >
        {/* BRAND HEADER */}
        <View style={{ alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <View
            style={{
              width: 68,
              height: 68,
              borderRadius: 34,
              backgroundColor: '#14532D',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
              borderWidth: 2,
              borderColor: '#F59E0B',
            }}
          >
            <Text style={{ fontSize: 34 }}>🍳</Text>
          </View>
          <Text
            variant="heading1"
            style={{ color: '#14532D', fontWeight: 'bold' }}
            accessibilityRole="header"
          >
            Foodie Partner
          </Text>
          <Text variant="caption" color={tokens.color.textSecondary}>
            Restaurant Partner Portal Sign In
          </Text>
        </View>

        {step === 'phone' ? (
          <>
            <Text variant="body" color={tokens.color.textSecondary}>
              Enter your registered mobile number to receive a one-time verification code (OTP).
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
              label="Send OTP Code"
              accessibilityLabel="Send OTP"
              loading={requestState.isLoading}
              disabled={busy}
              style={{ backgroundColor: '#14532D', height: 48 }}
              onPress={() => {
                void onRequestOtp();
              }}
            />
          </>
        ) : (
          <>
            <Text variant="body" color={tokens.color.textSecondary}>
              Enter the 6-digit verification code sent to <Text variant="label">{phoneNumber}</Text>.
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
              label="Verify & Login"
              accessibilityLabel="Verify OTP"
              loading={verifyState.isLoading}
              disabled={busy}
              style={{ backgroundColor: '#14532D', height: 48 }}
              onPress={() => {
                void onVerify();
              }}
            />
            <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
              <Button
                label={
                  cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'
                }
                accessibilityLabel="Resend OTP"
                variant="secondary"
                loading={requestState.isLoading}
                disabled={busy || cooldown > 0}
                style={{ flex: 1 }}
                onPress={() => {
                  void onResend();
                }}
              />
              <Button
                label="Change number"
                accessibilityLabel="Change phone number"
                variant="secondary"
                disabled={busy}
                style={{ flex: 1 }}
                onPress={() => {
                  setStep('phone');
                  setOtp('');
                  setOtpError(undefined);
                }}
              />
            </View>
          </>
        )}
      </View>

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

