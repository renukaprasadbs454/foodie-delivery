import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import {
  Button,
  DOCUMENT_ALLOWED_MIME_TYPES,
  isDocumentWithinSizeLimit,
  Text,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
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

/**
 * P2-RES-01 — POST /restaurants/me/documents (FSSAI|GST|PAN).
 * No list API — upload affordances only (UI-API Gap).
 */
export function RestaurantDocumentsScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const [upload, uploadState] = useUploadRestaurantDocumentMutation();
  const [docType, setDocType] = useState<RestaurantDocType>('FSSAI');
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
      setToast({ message: `${docType} uploaded.`, variant: 'success' });
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
          Documents
        </Text>
        <OnboardingStepper activeIndex={1} />
        <Text variant="body" color={tokens.color.textSecondary}>
          Upload FSSAI, GST, or PAN. Verification is performed by admin.
        </Text>

        <Text variant="label">Document type</Text>
        <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
          {DOC_TYPES.map((type) => {
            const selected = docType === type;
            return (
              <Pressable
                key={type}
                onPress={() => setDocType(type)}
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
          label={`Upload ${docType}`}
          accessibilityLabel={`Upload ${docType} document`}
          loading={uploadState.isLoading}
          onPress={() => {
            void onPickAndUpload();
          }}
        />
        <Button
          label="Continue to images"
          accessibilityLabel="Continue to images"
          variant="secondary"
          onPress={() => navigation.navigate('RestaurantImages')}
        />
        <Button
          label="Skip to pending"
          accessibilityLabel="Skip to pending approval"
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
