import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  Button,
  IMAGE_ALLOWED_MIME_TYPES,
  isImageWithinSizeLimit,
  Text,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useUploadRestaurantImagesMutation } from '../../../api/endpoints/restaurantsApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { OnboardingStepper } from '../components/OnboardingStepper';
import { IMAGE_TYPES, type RestaurantImageType } from '../types';
import type { OnboardingStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  'RestaurantImages'
>;

/**
 * P2-RES-01 — POST /restaurants/me/images (LOGO|COVER).
 */
export function RestaurantImagesScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const [upload, uploadState] = useUploadRestaurantImagesMutation();
  const [imageType, setImageType] = useState<RestaurantImageType>('LOGO');
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
    trackAnalyticsEvent('restaurant_images_viewed');
  }, []);

  const onPickAndUpload = async () => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to upload images.',
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
      aspect: imageType === 'LOGO' ? [1, 1] : [16, 9],
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
      await upload({
        imageType,
        uri: asset.uri,
        mimeType,
        fileName: asset.fileName ?? `${imageType.toLowerCase()}.jpg`,
      }).unwrap();
      trackAnalyticsEvent('image_uploaded', { imageType });
      trackAnalyticsEvent('restaurant_image_uploaded', { imageType });
      setToast({ message: `${imageType} uploaded.`, variant: 'success' });
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
      >
        <Text variant="heading1" accessibilityRole="header">
          Images
        </Text>
        <OnboardingStepper activeIndex={2} />
        <Text variant="body" color={tokens.color.textSecondary}>
          Upload a logo and cover image for your restaurant.
        </Text>

        <Text variant="label">Image type</Text>
        <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
          {IMAGE_TYPES.map((type) => {
            const selected = imageType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setImageType(type)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={type}
                style={{
                  paddingHorizontal: tokens.spacing.md,
                  paddingVertical: tokens.spacing.sm,
                  borderRadius: tokens.radius.sm,
                  borderWidth: 1,
                  borderColor: tokens.color.border,
                  backgroundColor: selected
                    ? tokens.color.accent
                    : tokens.color.surface,
                }}
              >
                <Text
                  variant="body"
                  color={
                    selected
                      ? tokens.color.textInverse
                      : tokens.color.textPrimary
                  }
                >
                  {type}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label={`Upload ${imageType}`}
          accessibilityLabel={`Upload ${imageType} image`}
          loading={uploadState.isLoading}
          onPress={() => {
            void onPickAndUpload();
          }}
        />
        <Button
          label="Continue to pending"
          accessibilityLabel="Continue to pending approval"
          variant="secondary"
          onPress={() => navigation.navigate('PendingApproval')}
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
