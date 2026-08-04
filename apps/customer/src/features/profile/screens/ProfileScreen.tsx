import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  Avatar,
  Button,
  Text,
  TextInput,
  Toast,
  IMAGE_ALLOWED_MIME_TYPES,
  isImageWithinSizeLimit,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useUploadProfileImageMutation,
} from '../../../api/endpoints/usersApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import type { ProfileStackParamList } from '../../../navigation/types';
import { ProfileSkeleton } from '../components/ProfileSkeleton';
import {
  initialsFromName,
  validateEmail,
  validateFullName,
} from '../types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

/**
 * P2-CUS-07 Profile — GET/PUT /users/me; profile image; nav to Addresses/Settings.
 */
export function ProfileScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const profileQuery = useGetMyProfileQuery();
  const [updateProfile, updateState] = useUpdateMyProfileMutation();
  const [uploadImage, uploadState] = useUploadProfileImageMutation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
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

  useEffect(() => {
    trackAnalyticsEvent('customer_profile_viewed');
  }, []);

  useEffect(() => {
    if (!profileQuery.data) return;
    setFullName(profileQuery.data.fullName ?? '');
    setEmail(profileQuery.data.email ?? '');
  }, [profileQuery.data]);

  const onSave = async () => {
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
        message: 'Connect to the internet to save your profile.',
        variant: 'warning',
      });
      return;
    }
    try {
      await updateProfile({
        fullName: nameResult.fullName,
        email: emailResult.email,
      }).unwrap();
      trackAnalyticsEvent('profile_saved');
      trackAnalyticsEvent('profile_updated');
      setToast({ message: 'Profile saved.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  const onPickPhoto = async () => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to upload a photo.',
        variant: 'warning',
      });
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setToast({
        message: 'Gallery permission denied — using default avatar.',
        variant: 'warning',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    if (
      !(IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)
    ) {
      setToast({
        message: 'Use a JPEG, PNG, or WebP image.',
        variant: 'error',
      });
      return;
    }
    if (
      typeof asset.fileSize === 'number' &&
      !isImageWithinSizeLimit(asset.fileSize)
    ) {
      setToast({
        message: 'Image must be 5 MB or smaller.',
        variant: 'error',
      });
      return;
    }
    try {
      await uploadImage({
        uri: asset.uri,
        mimeType,
        fileName: asset.fileName ?? 'profile.jpg',
      }).unwrap();
      setAvatarUri(asset.uri);
      trackAnalyticsEvent('photo_uploaded');
      setToast({ message: 'Photo uploaded.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 48,
        }}
        refreshControl={
          <RefreshControl
            refreshing={profileQuery.isFetching}
            onRefresh={() => {
              void profileQuery.refetch();
            }}
          />
        }
      >
        <Text variant="heading1" accessibilityRole="header">
          Profile
        </Text>
        {!isConnected ? (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — showing cached profile. Saves are blocked.
          </Text>
        ) : null}

        {profileQuery.isLoading && !profileQuery.data ? (
          <ProfileSkeleton />
        ) : (
          <>
            <View style={{ alignItems: 'center', gap: tokens.spacing.sm }}>
              <Avatar
                uri={avatarUri}
                initials={initialsFromName(fullName || profileQuery.data?.fullName)}
                size={72}
                accessibilityLabel="Profile avatar"
              />
              <Button
                label="Upload photo"
                accessibilityLabel="Upload photo"
                variant="secondary"
                loading={uploadState.isLoading}
                onPress={() => {
                  void onPickPhoto();
                }}
              />
            </View>

            <Text variant="caption" color={tokens.color.textSecondary}>
              Phone {profileQuery.data?.phoneNumber ?? '—'} (immutable here)
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
              label="Save profile"
              accessibilityLabel="Save profile"
              loading={updateState.isLoading}
              onPress={() => {
                void onSave();
              }}
            />

            <Button
              label="Addresses"
              accessibilityLabel="Addresses"
              variant="secondary"
              onPress={() => navigation.navigate('Addresses', {})}
            />
            <Button
              label="Settings"
              accessibilityLabel="Settings"
              variant="secondary"
              onPress={() => navigation.navigate('Settings')}
            />
          </>
        )}
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
