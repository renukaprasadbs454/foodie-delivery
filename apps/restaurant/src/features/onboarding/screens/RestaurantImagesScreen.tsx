import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  IMAGE_ALLOWED_MIME_TYPES,
  isImageWithinSizeLimit,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
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

const BRAND_PRIMARY = '#14532D';
const BRAND_ACCENT = '#F59E0B';

export function RestaurantImagesScreen({ navigation }: Props) {
  const { isConnected } = useConnectivity();
  const [upload, uploadState] = useUploadRestaurantImagesMutation();
  const [imageType, setImageType] = useState<RestaurantImageType>('LOGO');
  const [previewUri, setPreviewUri] = useState<string | null>(null);
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

  const onPickAndUpload = async (selectedImageType: RestaurantImageType) => {
    setImageType(selectedImageType);
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
        message: 'Gallery permission is required.',
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
    setPreviewUri(asset.uri);
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
        imageType: selectedImageType,
        uri: asset.uri,
        mimeType,
        fileName: asset.fileName ?? `${selectedImageType.toLowerCase()}.jpg`,
        fileObj: (asset as any).file,
      }).unwrap();
      trackAnalyticsEvent('image_uploaded', { imageType: selectedImageType });
      trackAnalyticsEvent('restaurant_image_uploaded', { imageType: selectedImageType });
      setToast({ message: `${selectedImageType} uploaded successfully!`, variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.headerBadge}>BRANDING & MEDIA</Text>
              <Text style={styles.headerTitle}>Restaurant Photos</Text>
              <Text style={styles.headerSubtitle}>
                Upload high-res logo and cover banner for customer display
              </Text>
            </View>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 26 }}>🖼️</Text>
            </View>
          </View>
        </View>

        {/* Stepper */}
        <OnboardingStepper activeIndex={2} />

        {/* Upload Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>📸 Image Slot Selection</Text>

          <View style={styles.imageTypeRow}>
            {IMAGE_TYPES.map((type) => {
              const selected = imageType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => {
                    void onPickAndUpload(type);
                  }}
                  style={[
                    styles.imageTypeChip,
                    selected && styles.imageTypeChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.imageTypeChipText,
                      selected && styles.imageTypeChipTextSelected,
                    ]}
                  >
                    {type === 'LOGO' ? '🏷️ Brand Logo' : '🖼️ Cover Banner'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Preview Box */}
          <View style={styles.previewBox}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.previewImage} />
            ) : (
              <View style={styles.placeholderBox}>
                <Text style={{ fontSize: 32 }}>
                  {imageType === 'LOGO' ? '🏷️' : '📸'}
                </Text>
                <Text style={styles.placeholderText}>
                  No {imageType.toLowerCase()} uploaded yet
                </Text>
                <Text style={styles.placeholderSub}>
                  {imageType === 'LOGO'
                    ? 'Square 1:1 format recommended (PNG or JPG)'
                    : 'Landscape 16:9 banner format recommended'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Continue Action */}
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
          onPress={() => navigation.navigate('PendingApproval')}
        >
          <Text style={styles.secondaryButtonText}>
            Submit & View Approval Status →
          </Text>
        </Pressable>
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
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 48,
  },
  headerCard: {
    backgroundColor: BRAND_PRIMARY,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND_ACCENT,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#A7F3D0',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: BRAND_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: BRAND_PRIMARY,
  },
  imageTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imageTypeChip: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  imageTypeChipSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: BRAND_PRIMARY,
  },
  imageTypeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  imageTypeChipTextSelected: {
    color: BRAND_PRIMARY,
    fontWeight: '900',
  },
  previewBox: {
    height: 160,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderBox: {
    alignItems: 'center',
    gap: 6,
    padding: 12,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  placeholderSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: BRAND_PRIMARY,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BRAND_PRIMARY,
  },
  secondaryButtonPressed: {
    opacity: 0.8,
  },
  secondaryButtonText: {
    color: BRAND_PRIMARY,
    fontSize: 15,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
