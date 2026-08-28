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
        backgroundColor: '#0F291E',
        paddingHorizontal: isWide ? tokens.spacing.xxl : tokens.spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 24,
          padding: tokens.spacing.xl,
          gap: tokens.spacing.lg,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 8,
          width: '100%',
          maxWidth: 440,
        }}
      >
        {/* BRAND HEADER */}
        <View style={{ alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#14532D',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
              borderWidth: 2,
              borderColor: '#F59E0B',
              shadowColor: '#14532D',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Text style={{ fontSize: 36 }}>🍳</Text>
          </View>
          <Text
            variant="heading1"
            style={{ color: '#0F291E', fontWeight: '800', fontSize: 26, letterSpacing: -0.5 }}
            accessibilityRole="header"
          >
            Foodie Partner
          </Text>
          <Text variant="caption" style={{ color: '#64748B', fontSize: 14 }}>
            Restaurant Portal • Secure iOS Sign In
          </Text>
        </View>

        {step === 'phone' ? (
          <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' }}>
              <Text variant="body" style={{ color: '#475569', fontSize: 13, lineHeight: 18 }}>
                Enter your mobile number to receive a secure 6-digit verification code (OTP).
              </Text>
            </View>

            <View>
              <TextInput
                label="Mobile Number"
                accessibilityLabel="Mobile number"
                value={phoneInput}
                onChangeText={setPhoneInput}
                keyboardType="phone-pad"
                autoComplete="tel"
                placeholder="+91 98XXXXXXXX"
                errorText={phoneError}
                editable={!busy}
              />
            </View>

            <Button
              label="Send OTP Code"
              accessibilityLabel="Send OTP"
              loading={requestState.isLoading}
              disabled={busy}
              style={{ backgroundColor: '#14532D', height: 50, borderRadius: 14 }}
              onPress={() => {
                void onRequestOtp();
              }}
            />
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#BBF7D0' }}>
              <Text variant="body" style={{ color: '#166534', fontSize: 13, lineHeight: 18 }}>
                Verification code sent to <Text style={{ fontWeight: '700' }}>{phoneNumber}</Text>
              </Text>
            </View>

            <TextInput
              label="One-Time Code"
              accessibilityLabel="One-time code"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="••••••"
              errorText={otpError}
              editable={!busy}
            />

            <Button
              label="Verify & Login"
              accessibilityLabel="Verify OTP"
              loading={verifyState.isLoading}
              disabled={busy}
              style={{ backgroundColor: '#14532D', height: 50, borderRadius: 14 }}
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
                style={{ flex: 1, borderRadius: 12 }}
                onPress={() => {
                  void onResend();
                }}
              />
              <Button
                label="Change number"
                accessibilityLabel="Change phone number"
                variant="secondary"
                disabled={busy}
                style={{ flex: 1, borderRadius: 12 }}
                onPress={() => {
                  setStep('phone');
                  setOtp('');
                  setOtpError(undefined);
                }}
              />
            </View>
          </View>
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

