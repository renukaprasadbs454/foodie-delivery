import React, { useCallback, useState, useEffect, useRef } from 'react';
import { View, KeyboardAvoidingView, ScrollView, Platform, TextInput as RNTextInput, Pressable, Animated, StatusBar } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Text,
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

  const scaleValue = useRef(new Animated.Value(0.95)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    trackAnalyticsEvent('customer_login_viewed');
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const onRequestOtp = async () => {
    setPhoneError(undefined);
    const phoneNumber = normalizeCustomerPhone(phoneInput);
    if (!isValidCustomerPhone(phoneNumber)) {
      setPhoneError('Enter a valid mobile number (+91).');
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
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#14532D' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar backgroundColor="#14532D" barStyle="light-content" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, backgroundColor: '#F2F2F7' }}
        keyboardShouldPersistTaps="handled"
        bounces={false}
      >
        {/* Brand Header */}
        <View style={{
          backgroundColor: '#14532D',
          height: 280,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 8,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
          elevation: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        }}>
          <View style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: '#FFFFFF',
            borderWidth: 3,
            borderColor: '#FCD34D',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#FCD34D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}>
            <Text style={{ fontSize: 42 }}>🥘</Text>
          </View>

          <Text style={{ fontWeight: '900', fontSize: 38, color: '#FCD34D', letterSpacing: 1.5, marginTop: 4 }}>
            FOODIE
          </Text>
          <Text style={{ color: '#A7F3D0', fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', fontSize: 13 }}>
            Premium Delivery Redefined
          </Text>
        </View>

        {/* Login Page Card with Entrance Animation */}
        <Animated.View style={{
          flex: 1,
          paddingHorizontal: 20,
          marginTop: -32,
          opacity: fadeValue,
          transform: [{ scale: scaleValue }],
        }}>
          <View style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: 24,
            shadowColor: '#14532D',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 8,
            borderWidth: 1,
            borderColor: '#E5E7EB',
            gap: 20,
            marginBottom: 32,
          }}>
            <Text style={{ color: '#14532D', fontSize: 24, fontWeight: '900', lineHeight: 30 }}>
              Savor High-End{"\n"}Dining at Home.
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', fontWeight: '600', marginTop: -8 }}>
              Log in to uncover gourmet local restaurants near you.
            </Text>

            <View style={{ gap: 20 }}>
              <View>
                <Text style={{ marginBottom: 8, fontSize: 12, fontWeight: '800', color: '#14532D', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Registered Mobile Number
                </Text>

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: phoneError ? '#EF4444' : '#E5E7EB',
                  height: 56,
                  paddingHorizontal: 16,
                  gap: 12,
                }}>
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    borderRightWidth: 1.5,
                    borderRightColor: '#E5E7EB',
                    paddingRight: 12,
                    height: '60%',
                  }}>
                    <Text style={{ fontSize: 20 }}>🇮🇳</Text>
                    <Text style={{ fontWeight: '800', color: '#111827', fontSize: 15 }}>+91</Text>
                  </View>
                  <RNTextInput
                    placeholder="Enter 10-digit number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={phoneInput}
                    onChangeText={(val) => {
                      setPhoneInput(val);
                      setPhoneError(undefined);
                    }}
                    editable={!busy}
                    style={{
                      flex: 1,
                      height: '100%',
                      fontSize: 16,
                      fontWeight: '700',
                      color: '#111827',
                      padding: 0,
                    }}
                  />
                </View>
                {phoneError ? (
                  <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 6, marginLeft: 4, fontWeight: '600' }}>
                    {phoneError}
                  </Text>
                ) : null}
              </View>

              <Pressable
                disabled={busy}
                onPress={() => { void onRequestOtp(); }}
                style={({ pressed }) => ({
                  backgroundColor: pressed || busy ? '#0F3E22' : '#14532D',
                  borderRadius: 14,
                  height: 56,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: '#FCD34D',
                  shadowColor: '#14532D',
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 4,
                })}
              >
                <Text style={{ color: '#FCD34D', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>
                  {requestState.isLoading ? 'Requesting OTP...' : 'Send Verification OTP'}
                </Text>
              </Pressable>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                <Text style={{ color: '#9CA3AF', fontWeight: '800', fontSize: 12, marginHorizontal: 16 }}>
                  SECURE ALTERNATIVE
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
              </View>

              <Pressable
                disabled={busy}
                onPress={() => { void onGoogle(); }}
                style={({ pressed }) => ({
                  borderRadius: 14,
                  height: 56,
                  backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
                  borderColor: '#E5E7EB',
                  borderWidth: 1.5,
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexDirection: 'row',
                  gap: 10,
                })}
              >
                <Text style={{ fontSize: 18 }}>🔑</Text>
                <Text style={{ color: '#374151', fontWeight: '800', fontSize: 15 }}>
                  {googleState.isLoading ? 'Connecting...' : 'Continue with Google'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Footer: Terms & Privacy policy */}
        <View style={{
          paddingVertical: 24,
          alignItems: 'center',
          gap: 6,
        }}>
          <Text style={{ textAlign: 'center', fontSize: 11, color: '#6B7280', fontWeight: '600' }}>
            By continuing, you agree to our
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Pressable onPress={() => showError('Terms of Service clicked')}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#14532D', textDecorationLine: 'underline' }}>Terms of Service</Text>
            </Pressable>
            <Text style={{ fontSize: 11, color: '#6B7280' }}>and</Text>
            <Pressable onPress={() => showError('Privacy Policy clicked')}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#14532D', textDecorationLine: 'underline' }}>Privacy Policy</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel="Login message"
        onDismiss={() => setToast(null)}
      />
    </KeyboardAvoidingView>
  );
}
