import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Button,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
} from 'foodie-shared-rn';
import { useUpdateMyProfileMutation } from '../../../api/endpoints/usersApi';
import { useAppDispatch } from '../../../store/hooks';
import { clearIsNewUser } from '../authSlice';
import { toUnwrappedApiError } from '../apiError';
import {
  validateEmail,
  validateFullName,
} from '../../profile/types';

/**
 * Premium Dark Green & Gold Profile Completion Gate Screen.
 * Modern food delivery mobile app design system.
 */
export function ProfileCompletionGateScreen() {
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const [updateProfile, updateState] = useUpdateMyProfileMutation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onInlineField: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onFullScreen: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) => setToast({ message: error.message, variant: 'error' }),
  });

  const onSubmit = async () => {
    const nameResult = validateFullName(fullName);
    if (!nameResult.ok) {
      setToast({ message: nameResult.message, variant: 'error' });
      return;
    }
    const emailResult = validateEmail(email);
    if (!emailResult.ok) {
      setToast({ message: emailResult.message, variant: 'error' });
      return;
    }
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to complete your profile.',
        variant: 'warning',
      });
      return;
    }
    try {
      await updateProfile({
        fullName: nameResult.fullName,
        email: emailResult.email,
      }).unwrap();
      dispatch(clearIsNewUser());
      trackAnalyticsEvent('profile_saved', { context: 'completion_gate' });
      trackAnalyticsEvent('profile_updated', { context: 'completion_gate' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#14532D" />

      {/* Top Premium Hero Header */}
      <View style={styles.heroHeader}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🍔</Text>
          </View>
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitle}>FOODIE</Text>
            <Text style={styles.brandTagline}>PREMIUM DELIVERY</Text>
          </View>
        </View>

        <View style={styles.welcomeContainer}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>FINAL STEP ✨</Text>
          </View>
          <Text style={styles.heroTitle}>Complete Your Profile</Text>
          <Text style={styles.heroSubtitle}>
            Personalize your account to start ordering delicious food to your doorstep.
          </Text>
        </View>
      </View>

      {/* Scrollable Form Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formCard}>
          <Text style={styles.formSectionTitle}>Account Details</Text>

          {/* Full Name Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>FULL NAME *</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              accessibilityLabel="Full name"
              autoCapitalize="words"
              placeholder="e.g. Rahul Sharma"
              containerStyle={styles.customInput}
            />
          </View>

          {/* Email Address Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS *</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              accessibilityLabel="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="e.g. rahul@example.com"
              containerStyle={styles.customInput}
            />
          </View>

          {/* Gold Action Button */}
          <TouchableOpacity
            activeOpacity={0.88}
            disabled={updateState.isLoading}
            onPress={() => {
              void onSubmit();
            }}
            style={styles.goldButton}
          >
            <Text style={styles.goldButtonText}>
              {updateState.isLoading ? 'SAVING PROFILE...' : 'SAVE & CONTINUE 🚀'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security / Privacy Trust Footer */}
        <View style={styles.footerContainer}>
          <View style={styles.securityRow}>
            <Text style={styles.shieldIcon}>🔒</Text>
            <Text style={styles.securityText}>
              Your information is safe and encrypted with Foodie Secure Auth.
            </Text>
          </View>
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> &{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>.
          </Text>
        </View>
      </ScrollView>

      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast'}
        onDismiss={() => setToast(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7', // Warm Beige Background
  },
  heroHeader: {
    backgroundColor: '#14532D', // Primary Dark Green
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 36,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 24,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A7F3D0',
    letterSpacing: 1.5,
  },
  welcomeContainer: {
    gap: 6,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#D1FAE5',
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 24,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 20,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14532D',
    letterSpacing: 0.3,
  },
  inputWrapper: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4B5563',
    letterSpacing: 1,
  },
  customInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderColor: '#E5E7EB',
    borderWidth: 1.5,
  },
  goldButton: {
    backgroundColor: '#F59E0B', // Primary Gold
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  goldButtonText: {
    color: '#14532D', // Dark Green
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  footerContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  shieldIcon: {
    fontSize: 14,
  },
  securityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  termsText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#14532D',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
