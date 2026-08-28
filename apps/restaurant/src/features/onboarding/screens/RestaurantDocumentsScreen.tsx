import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import {
  DOCUMENT_ALLOWED_MIME_TYPES,
  isDocumentWithinSizeLimit,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
} from 'foodie-shared-rn';
import { useUploadRestaurantDocumentMutation } from '../../../api/endpoints/restaurantsApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { OnboardingStepper } from '../components/OnboardingStepper';
import { DOC_TYPES, type RestaurantDocType } from '../types';
import type { OnboardingStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  'RestaurantDocuments'
>;

const BRAND_PRIMARY = '#14532D';
const BRAND_ACCENT = '#F59E0B';

export function RestaurantDocumentsScreen({ navigation }: Props) {
  const { isConnected } = useConnectivity();
  const [upload, uploadState] = useUploadRestaurantDocumentMutation();
  const [docType, setDocType] = useState<RestaurantDocType>('FSSAI');
  const [uploadedTypes, setUploadedTypes] = useState<Record<string, boolean>>({});
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
    trackAnalyticsEvent('restaurant_documents_viewed');
  }, []);

  const onPickAndUpload = async () => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to upload documents.',
        variant: 'warning',
      });
      return;
    }
    const result = await DocumentPicker.getDocumentAsync({
      type: [...DOCUMENT_ALLOWED_MIME_TYPES],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'application/pdf';
    if (!(DOCUMENT_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      setToast({
        message: 'Use a PDF, JPEG, or PNG document.',
        variant: 'error',
      });
      return;
    }
    if (
      typeof asset.size === 'number' &&
      !isDocumentWithinSizeLimit(asset.size)
    ) {
      setToast({
        message: 'Document must be 10 MB or smaller.',
        variant: 'error',
      });
      return;
    }
    try {
      await upload({
        docType,
        uri: asset.uri,
        mimeType,
        fileName: asset.name || `${docType.toLowerCase()}.pdf`,
      }).unwrap();
      trackAnalyticsEvent('document_uploaded', { docType });
      trackAnalyticsEvent('restaurant_document_uploaded', { docType });
      setUploadedTypes((prev) => ({ ...prev, [docType]: true }));
      setToast({ message: `${docType} uploaded successfully!`, variant: 'success' });
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
              <Text style={styles.headerBadge}>COMPLIANCE & LEGAL</Text>
              <Text style={styles.headerTitle}>Upload KYC Documents</Text>
              <Text style={styles.headerSubtitle}>
                Provide official legal certificates for verification
              </Text>
            </View>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 26 }}>📄</Text>
            </View>
          </View>
        </View>

        {/* Stepper */}
        <OnboardingStepper activeIndex={1} />

        {/* Upload Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>📋 Document Selection</Text>

          <View style={styles.docTypeRow}>
            {DOC_TYPES.map((type) => {
              const selected = docType === type;
              const isUploaded = Boolean(uploadedTypes[type]);
              return (
                <Pressable
                  key={type}
                  onPress={() => setDocType(type)}
                  style={[
                    styles.docTypeChip,
                    selected && styles.docTypeChipSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.docTypeChipText,
                      selected && styles.docTypeChipTextSelected,
                    ]}
                  >
                    {isUploaded ? '✓ ' : ''}{type}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Guidelines Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>📌 Requirements for {docType}:</Text>
            <Text style={styles.infoText}>
              • Accepted Formats: PDF, PNG, JPG (Max 10 MB).{'\n'}
              • Must show legible license number, validity, and business address.
            </Text>
          </View>

          {/* Upload CTA Button */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
              uploadState.isLoading && styles.buttonDisabled,
            ]}
            onPress={() => void onPickAndUpload()}
            disabled={uploadState.isLoading}
          >
            {uploadState.isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                📤 Choose & Upload {docType}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Navigation Action Buttons */}
        <View style={{ gap: 12 }}>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
            onPress={() => navigation.navigate('RestaurantImages')}
          >
            <Text style={styles.secondaryButtonText}>
              Proceed to Images →
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.textButton,
              pressed && styles.textButtonPressed,
            ]}
            onPress={() => navigation.navigate('PendingApproval')}
          >
            <Text style={styles.textButtonText}>
              Skip to Approval Status
            </Text>
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
  docTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  docTypeChip: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  docTypeChipSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: BRAND_PRIMARY,
  },
  docTypeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  docTypeChipTextSelected: {
    color: BRAND_PRIMARY,
    fontWeight: '900',
  },
  infoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: BRAND_PRIMARY,
  },
  infoText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
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
    paddingVertical: 15,
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
  textButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  textButtonPressed: {
    opacity: 0.6,
  },
  textButtonText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
