import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  Button,
  DOCUMENT_ALLOWED_MIME_TYPES,
  IMAGE_ALLOWED_MIME_TYPES,
  isDocumentWithinSizeLimit,
  isImageWithinSizeLimit,
  Text,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useUploadDeliveryDocumentMutation } from '../../../api/endpoints/deliveryApi';
import { useUploadProfileImageMutation } from '../../../api/endpoints/usersApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { KycStepper } from '../components/KycStepper';
import {
  documentUploaded,
  profileImageUploaded,
  selectKycDocuments,
  selectKycProfileImage,
  selectSelectedDocType,
  setSelectedDocType,
} from '../kycFormSlice';
import { DOC_TYPES, isDeliveryDocType } from '../types';
import type { KycStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<KycStackParamList, 'Kyc'>;

/**
 * P2-DEL-01 — POST /delivery/me/documents + POST /users/me/profile-image.
 * No document list API (GAP-API-09). No partner profile GET (GAP-API-08).
 */
export function KycScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const docType = useAppSelector(selectSelectedDocType);
  const documents = useAppSelector(selectKycDocuments);
  const profileImage = useAppSelector(selectKycProfileImage);
  const [uploadDocument, documentState] = useUploadDeliveryDocumentMutation();
  const [uploadProfile, profileState] = useUploadProfileImageMutation();
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
    trackAnalyticsEvent('delivery_kyc_viewed');
  }, []);

  const onPickAndUploadDocument = async () => {
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
      const uploaded = await uploadDocument({
        docType,
        uri: asset.uri,
        mimeType,
        fileName: asset.name || `${docType.toLowerCase()}.pdf`,
      }).unwrap();
      const resolvedType = isDeliveryDocType(uploaded.docType)
        ? uploaded.docType
        : docType;
      dispatch(
        documentUploaded({
          documentId: uploaded.documentId,
          docType: resolvedType,
          verificationStatus: uploaded.verificationStatus ?? 'PENDING',
          fileKey: uploaded.fileKey,
          uploadedAt: uploaded.uploadedAt,
        }),
      );
      trackAnalyticsEvent('document_uploaded', { docType });
      trackAnalyticsEvent('delivery_kyc_document_uploaded', { docType });
      setToast({ message: `${docType} uploaded.`, variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  const onPickAndUploadProfile = async () => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to upload a profile image.',
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
      const uploaded = await uploadProfile({
        uri: asset.uri,
        mimeType,
        fileName: asset.fileName ?? 'profile.jpg',
      }).unwrap();
      dispatch(profileImageUploaded(uploaded));
      trackAnalyticsEvent('document_uploaded', { docType: 'PROFILE_IMAGE' });
      setToast({ message: 'Profile image uploaded.', variant: 'success' });
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
          KYC documents
        </Text>
        <KycStepper activeIndex={0} />
        <Text variant="body" color={tokens.color.textSecondary}>
          Upload LICENSE, VEHICLE_RC, and IDENTITY. Verification is performed by
          admin — you cannot self-verify. Availability stays disabled until
          verified.
        </Text>

        <Text variant="label">Document type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: tokens.spacing.sm }}>
          {DOC_TYPES.map((type) => {
            const selected = docType === type;
            const uploaded = Boolean(documents[type]);
            return (
              <Pressable
                key={type}
                onPress={() => dispatch(setSelectedDocType(type))}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${type}${uploaded ? ', uploaded' : ''}`}
                style={{
                  minHeight: 48,
                  justifyContent: 'center',
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
                  {uploaded ? `${type} (uploaded)` : type}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          label={`Upload ${docType}`}
          accessibilityLabel={`Upload ${docType} document`}
          loading={documentState.isLoading}
          onPress={() => {
            void onPickAndUploadDocument();
          }}
        />

        <Text variant="label">Profile image</Text>
        <Text variant="caption" color={tokens.color.textSecondary}>
          {profileImage
            ? `Uploaded${profileImage.uploadedAt ? ` at ${profileImage.uploadedAt}` : ''}.`
            : 'Optional selfie / profile photo for your partner profile.'}
        </Text>
        <Button
          label="Upload profile image"
          accessibilityLabel="Upload profile image"
          variant="secondary"
          loading={profileState.isLoading}
          onPress={() => {
            void onPickAndUploadProfile();
          }}
        />

        <Button
          label="Continue to pending verification"
          accessibilityLabel="Continue to pending verification"
          variant="secondary"
          onPress={() => navigation.navigate('PendingVerification')}
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
