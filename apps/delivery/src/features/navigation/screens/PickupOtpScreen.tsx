import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
    <View style={styles.container}>
      {/* Decorative Dark Top Background */}
      <View style={[styles.topArch, { height: 180 }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBox}>
          <Text style={styles.pageTitle}>Pickup OTP</Text>
          <Text style={styles.pageSubtitle}>Verify your pickup from the restaurant</Text>

          {!isConnected ? (
            <View style={styles.warningContainer}>
              <Feather name="wifi-off" size={16} color="#B91C1C" />
              <Text style={styles.warningText}>
                Offline — pickup OTP verification is blocked
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.formCard}>
          <View style={styles.iconCircle}>
            <Feather name="box" size={32} color="#14532D" />
          </View>

          <Text style={styles.cardTitle}>Enter 6-Digit Code</Text>
          <Text style={styles.cardSubtitle}>
            Ask the restaurant for the OTP to continue. It is never shown in the app for security.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              label="Secret OTP Code"
              accessibilityLabel="Pickup OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              errorText={fieldError}
              editable={isConnected && !verifyState.isLoading}
            />
          </View>

          <Pressable
            style={[
              styles.actionButton,
              (!isConnected || verifyState.isLoading) && styles.actionButtonDisabled
            ]}
            onPress={() => void onSubmit()}
            disabled={!isConnected || verifyState.isLoading}
          >
            <Text style={styles.actionButtonText}>
              {verifyState.isLoading ? 'Verifying...' : 'Verify Pickup'}
            </Text>
            {!verifyState.isLoading && (
              <Feather name="arrow-right" size={20} color="#FFFFFF" style={styles.actionIconRight} />
            )}
          </Pressable>
        </View>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  topArch: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: '#14532D',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 60,
  },
  headerBox: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 15,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  warningText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
    minHeight: 80,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#14532D',
    borderRadius: 16,
    height: 56,
    width: '100%',
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  actionButtonDisabled: {
    backgroundColor: '#CBD5E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionIconRight: {
    marginLeft: 8,
  },
});
