import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  Avatar,
  Button,
  ListItem,
  Text,
  Toast,
  IMAGE_ALLOWED_MIME_TYPES,
  isImageWithinSizeLimit,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useUploadProfileImageMutation } from '../../../api/endpoints/usersApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import {
  selectUserId,
  selectUserType,
} from '../../auth/authSlice';
import { useAppSelector } from '../../../store/hooks';
import type { MainStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'DeliveryProfile'>;

/**
 * P2-DEL-05 Profile — session identity + profile-image upload.
 * GET /delivery/me is GAP-API-08 — no invented partner profile GET.
 */
export function DeliveryProfileScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const userId = useAppSelector(selectUserId);
  const userType = useAppSelector(selectUserType);
  const [uploadImage, uploadState] = useUploadProfileImageMutation();
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
    trackAnalyticsEvent('delivery_profile_viewed');
  }, []);

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
        message: 'Gallery permission denied.',
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
    if (!(IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
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
      trackAnalyticsEvent('profile_image_uploaded');
      setToast({ message: 'Photo uploaded.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  const initials = userId ? userId.slice(0, 2).toUpperCase() : 'DP';

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 48,
        }}
      >
        <Text variant="heading1" accessibilityRole="header">
          Profile
        </Text>

        <View style={{ alignItems: 'center', gap: tokens.spacing.sm }}>
          <Avatar
            uri={avatarUri}
            initials={initials}
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

        <View
          style={{
            padding: tokens.spacing.md,
            borderRadius: tokens.radius.md,
            borderWidth: 1,
            borderColor: tokens.color.border,
            backgroundColor: tokens.color.surface,
            gap: tokens.spacing.xs,
          }}
        >
          <Text variant="label">Session identity</Text>
          <Text variant="body" color={tokens.color.textSecondary}>
            User ID {userId ?? '—'}
          </Text>
          <Text variant="caption" color={tokens.color.textSecondary}>
            Role {userType ?? 'DELIVERY_PARTNER'}
          </Text>
          <Text variant="caption" color={tokens.color.warning}>
            Partner profile fields and kycStatus need GET /delivery/me
            (GAP-API-08). KYC upload remains on the onboarding gate.
          </Text>
        </View>

        <ListItem
          title="Settings"
          subtitle="Preferences and log out"
          accessibilityLabel="Open settings"
          onPress={() => navigation.navigate('DeliverySettings')}
        />
        <ListItem
          title="Wallet"
          subtitle="Balance, ledger, payout"
          accessibilityLabel="Open wallet"
          onPress={() => navigation.navigate('Wallet')}
        />
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
