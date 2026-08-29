import React, { useCallback, useEffect, useState } from 'react';
import { View, KeyboardAvoidingView, ScrollView, Platform, Image, Pressable } from 'react-native';
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: tokens.color.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, backgroundColor: tokens.color.background }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Stunning Vector Brand Header */}
        <View style={{
          backgroundColor: '#14532D', // Deep Green
          height: 240,
          justifyContent: 'center',
          alignItems: 'center',
          gap: tokens.spacing.xs,
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
        }}>
          <View style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: '#FFFFFF',
            borderWidth: 3,
            borderColor: '#F59E0B', // Gold Accent
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#F59E0B',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 6,
            elevation: 4,
          }}>
            <Text style={{ fontSize: 32 }}>🔑</Text>
          </View>

          <Text variant="display" color="#FFFFFF" style={{ fontWeight: '900', fontSize: 28, marginTop: 10 }}>
            Security Verification
          </Text>
          <Text variant="caption" style={{ color: '#F59E0B', fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Enter OTP Code to proceed
          </Text>
        </View>

        {/* Floating Input Card container */}
        <View style={{
          flex: 1,
          paddingHorizontal: tokens.spacing.xl,
          marginTop: -40,
        }}>
          <View style={{
            backgroundColor: tokens.color.surface,
            borderRadius: tokens.radius.lg,
            padding: tokens.spacing.xl,
            shadowColor: '#14532D',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
            elevation: 8,
            borderWidth: 1,
            borderColor: tokens.color.border,
            gap: tokens.spacing.lg,
            marginBottom: tokens.spacing.xxl,
          }}>
            <View>
              <Text variant="heading2" color={tokens.color.accent} style={{ fontWeight: '800', marginBottom: tokens.spacing.xs }}>
                Enter OTP Code
              </Text>
              <Text variant="body" color={tokens.color.textSecondary}>
                We sent a 6-digit verification code to
              </Text>
              <Text variant="body" color={tokens.color.textPrimary} style={{ fontWeight: 'bold', marginTop: 2 }}>
                {phoneNumber}
              </Text>
            </View>

            <View style={{ gap: tokens.spacing.lg }}>
              <TextInput
                label="Verification Code"
                accessibilityLabel="Verification Code"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                errorText={otpError}
                editable={!busy}
                placeholder="------"
                containerStyle={{
                  backgroundColor: tokens.color.background,
                  borderRadius: tokens.radius.lg,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOpacity: 0.05,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 },
                }}
              />

              <Button
                label="Verify Code"
                accessibilityLabel="Verify OTP"
                loading={verifyState.isLoading}
                disabled={busy}
                onPress={() => {
                  void onVerify();
                }}
                style={{
                  backgroundColor: '#14532D', // Primary Dark Green
                  borderRadius: tokens.radius.lg,
                  height: 56,
                  elevation: 4,
                  shadowColor: '#14532D',
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                }}
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: tokens.spacing.sm }}>
                <Pressable
                  onPress={() => {
                    if (cooldown === 0) void onResend();
                  }}
                  disabled={busy || cooldown > 0}
                  style={({ pressed }) => ({
                    opacity: (busy || cooldown > 0) ? 0.5 : pressed ? 0.7 : 1,
                  })}
                >
                  <Text variant="label" color={cooldown > 0 ? tokens.color.textSecondary : tokens.color.accent} style={{ fontWeight: '700' }}>
                    {cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    if (!busy) navigation.navigate('Login');
                  }}
                  disabled={busy}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text variant="label" color={tokens.color.accent} style={{ fontWeight: '700' }}>
                    Change Number
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel="OTP message"
        onDismiss={() => setToast(null)}
      />
    </KeyboardAvoidingView>
  );
}


