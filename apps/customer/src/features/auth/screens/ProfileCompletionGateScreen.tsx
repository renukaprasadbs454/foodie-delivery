import React, { useState } from 'react';
import { View } from 'react-native';
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
import { useUpdateMyProfileMutation } from '../../../api/endpoints/usersApi';
import { useAppDispatch } from '../../../store/hooks';
import { clearIsNewUser } from '../authSlice';
import { toUnwrappedApiError } from '../apiError';
import {
  validateEmail,
  validateFullName,
} from '../../profile/types';

/**
 * P2-AUTH-01 gate + P2-CUS-07 PUT /users/me profile completion.
 * Clears isNewUser after successful full-replace of fullName/email.
 */
export function ProfileCompletionGateScreen() {
  const { tokens } = useTheme();
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
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.color.background,
        padding: tokens.spacing.xl,
        justifyContent: 'center',
        gap: tokens.spacing.md,
      }}
    >
      <Text
        variant="heading1"
        accessibilityRole="header"
        style={{ textAlign: 'center', marginBottom: tokens.spacing.sm }}
      >
        Complete your profile
      </Text>
      <Text variant="body" color={tokens.color.textSecondary}>
        Add your name and email to continue.
      </Text>
      <TextInput
        label="Full name"
        value={fullName}
        onChangeText={setFullName}
        accessibilityLabel="Full name"
        autoCapitalize="words"
      />
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        accessibilityLabel="Email"
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button
        label="Continue"
        accessibilityLabel="Continue"
        loading={updateState.isLoading}
        onPress={() => {
          void onSubmit();
        }}
      />
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
