import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Divider,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useGoogleAuthMutation,
  useRequestOtpMutation,
} from '../../../api/endpoints/authApi';
import type { AuthStackParamList } from '../../../navigation/types';
import { toUnwrappedApiError } from '../apiError';
import { obtainGoogleIdToken } from '../googleSignIn';
import { isValidCustomerPhone, normalizeCustomerPhone } from '../phone';
import { applyAuthSession } from '../session';
import { useAppDispatch } from '../../../store/hooks';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

/**
 * P2-AUTH-01 Login — phone OTP request or Google Sign-In (UI-API Login).
 */
export function LoginScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const dispatch = useAppDispatch();
  const { isConnected } = useConnectivity();
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState<string | undefined>();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'error' | 'info' | 'success';
  } | null>(null);
  const [requestOtp, requestState] = useRequestOtpMutation();
  const [googleAuth, googleState] = useGoogleAuthMutation();

  const showError = useCallback((message: string) => {
    setToast({ message, variant: 'error' });
  }, []);

  const handleApiError = useApiErrorHandler({
    onInlineField: (error) => {
      const fieldMsg = error.fields?.phoneNumber;
      if (fieldMsg) setPhoneError(fieldMsg);
      else showError(error.message);
    },
    onToast: (error) => showError(error.message),
    onForceLogout: (error) => showError(error.message),
    onFullScreen: (error) => showError(error.message),
    onModalBlocking: (error) => showError(error.message),
    onGeneric: (error) => showError(error.message),
  });

  React.useEffect(() => {
    trackAnalyticsEvent('customer_login_viewed');
  }, []);

  const onRequestOtp = async () => {
    setPhoneError(undefined);
    if (!isConnected) {
      showError('You are offline. Connect to request an OTP.');
      return;
    }
    const phoneNumber = normalizeCustomerPhone(phoneInput);
    if (!isValidCustomerPhone(phoneNumber)) {
      setPhoneError('Enter a valid Indian mobile number (+91).');
      return;
    }
    trackAnalyticsEvent('otp_request_tapped');
    try {
      await requestOtp({ phoneNumber }).unwrap();
      trackAnalyticsEvent('auth_otp_requested');
      navigation.navigate('OtpVerification', { phoneNumber });
    } catch (err) {
      handleApiError(toUnwrappedApiError(err));
    }
  };

  const onGoogle = async () => {
    if (!isConnected) {
      showError('You are offline. Connect to continue with Google.');
      return;
    }
    trackAnalyticsEvent('google_continue_tapped');
    trackAnalyticsEvent('auth_google_started');
    const result = await obtainGoogleIdToken();
    if (result.status === 'cancelled') return;
    if (result.status === 'unavailable') {
      showError(result.message);
      return;
    }
    try {
      const data = await googleAuth({ idToken: result.idToken }).unwrap();
      await applyAuthSession(dispatch, data);
    } catch (err) {
      handleApiError(toUnwrappedApiError(err));
    }
  };

  const busy = requestState.isLoading || googleState.isLoading;

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
        Sign in
      </Text>
      <Text variant="body" color={tokens.color.textSecondary}>
        Enter your mobile number to receive a one-time code.
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
        label="Continue with OTP"
        accessibilityLabel="Continue with OTP"
        loading={requestState.isLoading}
        disabled={busy}
        onPress={() => {
          void onRequestOtp();
        }}
      />
      <Divider />
      <Button
        label="Continue with Google"
        accessibilityLabel="Continue with Google"
        variant="secondary"
        loading={googleState.isLoading}
        disabled={busy}
        onPress={() => {
          void onGoogle();
        }}
      />
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
