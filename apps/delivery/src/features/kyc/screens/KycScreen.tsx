import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, TextInput, Image as RNImage } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ENV } from '../../../constants/env';
import {
  Button,
  Text,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
  Toast,
  clearRefreshToken,
} from 'foodie-shared-rn';
import { useUploadDeliveryDocumentMutation, useGetDeliveryProfileQuery, useUpsertDeliveryProfileMutation, useUploadDeliveryProfileImageMutation } from '../../../api/endpoints/deliveryApi';
import { baseApi } from '../../../api/baseApi';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../../store/hooks';
import { documentUploaded, selectKycDocuments } from "../kycFormSlice";
import { isDeliveryDocType, type DeliveryDocType } from "../types";
import type { MainStackParamList, RootStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<any, 'Kyc'>;

const THEME_EMERALD = '#14532D';

const REQUIRED_DOCS = [
  { type: 'IDENTITY' as DeliveryDocType, label: 'Identity Proof', desc: 'Aadhaar, PAN, or Passport', icon: 'person-outline' },
  { type: 'LICENSE' as DeliveryDocType, label: 'Driving License', desc: 'Valid Driving License front & back', icon: 'card-outline' },
  { type: 'VEHICLE_RC' as DeliveryDocType, label: 'Vehicle RC', desc: 'Registration Certificate', icon: 'document-text-outline' },
];

export function KycScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const dispatch = useAppDispatch();
  const { isConnected } = useConnectivity();
  const [toast, setToast] = useState<{ message: string; variant: 'info' | 'success' | 'error' | 'warning' } | null>(null);

  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const cameraRef = React.useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [uploadDocument] = useUploadDeliveryDocumentMutation();
  const profileQuery = useGetDeliveryProfileQuery(undefined, { refetchOnFocus: true });

  const [uploadingType, setUploadingType] = useState<DeliveryDocType | null>(null);

  const uploadingDocType = React.useMemo(() => uploadingType, [uploadingType]);

  const reduxDocuments = useSelector(selectKycDocuments);
  const apiDocuments = profileQuery.data?.documents ?? [];

  const [upsertProfile] = useUpsertDeliveryProfileMutation();
  const [partnerName, setPartnerName] = useState('');

  React.useEffect(() => {
    if (profileQuery.data?.fullName && profileQuery.data.fullName !== 'Delivery Partner' && !partnerName) {
      setPartnerName(profileQuery.data.fullName);
    }
  }, [profileQuery.data?.fullName]);

  const handleDocumentPickAndUpload = async (docType: DeliveryDocType) => {
    if (!isConnected) {
      setToast({ message: 'Connect to the internet to upload documents.', variant: 'warning' });
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'application/pdf';

      setUploadingType(docType);

      const uploaded = await uploadDocument({
        docType,
        uri: asset.uri,
        mimeType,
        fileName: asset.name || `${docType.toLowerCase()}.pdf`,
        webFile: (asset as any).file,
      }).unwrap();

      const resolvedType = isDeliveryDocType(uploaded.docType) ? uploaded.docType : docType;

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
      setToast({ message: `${docType} uploaded successfully.`, variant: 'success' });
      profileQuery.refetch();
    } catch (error: any) {
      const errStr = typeof error === 'object' ? JSON.stringify(error) : String(error);
      setToast({ message: `ERR: ${errStr}`.substring(0, 100), variant: 'error' });
    } finally {
      setUploadingType(null);
    }
  };

  const getDocStatus = (docType: DeliveryDocType) => {
    const reduxDoc = reduxDocuments[docType];
    if (reduxDoc) return { isUploaded: true, status: reduxDoc.verificationStatus, id: reduxDoc.documentId };

    const apiDoc = apiDocuments.find((d: any) => d.docType === docType);
    if (apiDoc) return { isUploaded: true, status: apiDoc.verificationStatus, id: apiDoc.documentId };

    return { isUploaded: false, status: 'MISSING' };
  };

  const [uploadProfileImageMutation, { isLoading: isUploadingProfile }] = useUploadDeliveryProfileImageMutation();

  const handleSelfieCapture = async () => {
    if (!isConnected) {
      setToast({ message: 'Connect to the internet to upload selfie.', variant: 'warning' });
      return;
    }
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setToast({ message: 'Camera permission is required to take a selfie.', variant: 'warning' });
        return;
      }
    }
    setIsCameraVisible(true);
  };

  const handleCapturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.5,
      });

      setIsCameraVisible(false);

      if (!result) return;

      const mimeType = 'image/jpeg';

      await uploadProfileImageMutation({
        uri: result.uri,
        mimeType,
        fileName: 'selfie.jpg',
      }).unwrap();

      trackAnalyticsEvent('profile_photo_uploaded');
      setToast({ message: 'Selfie uploaded successfully.', variant: 'success' });
      profileQuery.refetch();
    } catch (error: any) {
      setIsCameraVisible(false);
      const errStr = typeof error === 'object' ? JSON.stringify(error) : String(error);
      setToast({ message: `ERR: ${errStr}`.substring(0, 100), variant: 'error' });
    }
  };

  const isAllUploaded = REQUIRED_DOCS.every((d) => getDocStatus(d.type).isUploaded) && Boolean(profileQuery.data?.profileImageUrl);

  let finalImgUri = profileQuery.data?.profileImageUrl ?? null;
  if (finalImgUri) {
    const apiBaseUrl = ENV.apiBaseUrl;
    if (finalImgUri.includes('localhost') && apiBaseUrl) {
      const hostMatch = apiBaseUrl.match(/:\/\/(.[^:/]+)/);
      if (hostMatch && hostMatch[1]) {
        finalImgUri = finalImgUri.replace('localhost', hostMatch[1]);
      }
    } else if (finalImgUri.startsWith('/') && apiBaseUrl) {
      finalImgUri = `${apiBaseUrl.replace(/\/$/, '')}${finalImgUri}`;
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={styles.topGradientBar}>
        <View style={styles.topNavRow}>
          <Pressable style={styles.backButton} onPress={() => navigation.canGoBack() ? navigation.goBack() : null}>
            <Feather name="arrow-left" size={24} color="white" />
          </Pressable>
          <Text variant="heading2" style={{ color: 'white', flex: 1, marginLeft: 16 }}>Onboarding</Text>
          <Pressable style={styles.helpPill} onPress={async () => {
            await clearRefreshToken();
            dispatch({ type: 'auth/clearCredentials' });
            setTimeout(() => {
              dispatch(baseApi.util.resetApiState());
            }, 500);
          }}>
            <Feather name="log-out" size={16} color="black" />
            <Text variant="caption" style={{ marginLeft: 4, fontWeight: 'bold' }}>LOGOUT</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <MaterialIcons name="security" size={48} color={THEME_EMERALD} />
          <Text variant="heading1" style={{ marginTop: 12 }}>KYC & Profile</Text>
          <Text variant="body" color={tokens.color.textSecondary}>We require these details to securely approve your partner account.</Text>
        </View>

        <View style={styles.docList}>
          <Pressable
            style={[styles.docCard, Boolean(profileQuery.data?.profileImageUrl) && styles.docCardUploaded]}
            onPress={handleSelfieCapture}
            disabled={isUploadingProfile}
          >
            <View style={[styles.iconCircle, { backgroundColor: finalImgUri ? '#dcfce7' : '#f1f5f9', overflow: 'hidden' }]}>
              {finalImgUri ? (
                <RNImage
                  source={{ uri: finalImgUri }}
                  style={{ width: 48, height: 48, borderRadius: 24 }}
                  resizeMode="cover"
                />
              ) : (
                <Feather name="camera" size={24} color="#64748b" />
              )}
            </View>

            <View style={styles.docInfo}>
              <Text variant="heading3" style={{ color: profileQuery.data?.profileImageUrl ? THEME_EMERALD : '#334155', marginBottom: 4 }}>
                Selfie
              </Text>
              <Text variant="caption" color={tokens.color.textSecondary}>
                {isUploadingProfile ? 'Uploading...' : profileQuery.data?.profileImageUrl ? 'Uploaded' : 'Capture clear selfie'}
              </Text>
            </View>

            {profileQuery.data?.profileImageUrl ? (
              <Feather name="check-circle" size={24} color={THEME_EMERALD} />
            ) : (
              <Feather name="upload-cloud" size={24} color="#64748b" />
            )}
          </Pressable>

          <View style={styles.docCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#f1f5f9' }]}>
              <Feather name="user" size={24} color="#64748b" />
            </View>
            <View style={styles.docInfo}>
              <Text variant="heading3" style={{ color: '#334155', marginBottom: 4 }}>Full Name</Text>
              <TextInput
                style={styles.nameInput}
                placeholder="Enter your full name"
                value={partnerName}
                onChangeText={setPartnerName}
                placeholderTextColor="#A0AEC0"
              />
            </View>
          </View>
          {REQUIRED_DOCS.map(doc => {
            const status = getDocStatus(doc.type);
            const isUploading = uploadingDocType === doc.type;

            return (
              <Pressable
                key={doc.type}
                style={[styles.docCard, status.isUploaded && styles.docCardUploaded]}
                onPress={() => handleDocumentPickAndUpload(doc.type)}
                disabled={isUploading}
              >
                <View style={[styles.iconCircle, { backgroundColor: status.isUploaded ? '#dcfce7' : '#f1f5f9' }]}>
                  <Ionicons name={doc.icon as any} size={24} color={status.isUploaded ? THEME_EMERALD : '#64748b'} />
                </View>

                <View style={styles.docInfo}>
                  <Text variant="heading3" style={{ color: status.isUploaded ? THEME_EMERALD : '#334155', marginBottom: 4 }}>
                    {doc.label}
                  </Text>
                  <Text variant="caption" color={tokens.color.textSecondary}>
                    {isUploading ? 'Uploading...' : status.isUploaded ? 'Uploaded' : doc.desc}
                  </Text>
                </View>

                {status.isUploaded ? (
                  <Feather name="check-circle" size={24} color={THEME_EMERALD} />
                ) : (
                  <Feather name="upload-cloud" size={24} color="#64748b" />
                )}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.bottomCard}>
          <Text variant="heading3" style={{ color: isAllUploaded ? THEME_EMERALD : '#64748b', marginBottom: 12 }}>
            {isAllUploaded ? 'All details are ready!' : 'Enter name and upload all documents'}
          </Text>
          <Button
            label="Continue to Verification"
            variant="primary"
            disabled={!isAllUploaded || !partnerName.trim()}
            onPress={async () => {
              if (isConnected) {
                try {
                  await upsertProfile({ fullName: partnerName.trim(), vehicleType: 'BIKE', vehicleNumber: '' }).unwrap();
                } catch (e) {
                  setToast({ message: 'Failed to update name', variant: 'error' });
                  return;
                }
              }
              navigation.navigate('PendingVerification');
            }}
            accessibilityLabel="Continue to Verification"
          />
        </View>
      </ScrollView>

      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        onDismiss={() => setToast(null)}
        accessibilityLabel={toast?.message ?? 'Toast message'}
      />

      {isCameraVisible && (
        <View style={styles.cameraModal}>
          <Text variant="heading1" style={styles.cameraTitle}>Identity Verification</Text>
          <Text variant="caption" style={styles.cameraSubtitle}>Position your face in the circle for your profile photo</Text>
          <View style={styles.cameraMask}>
            <CameraView
              style={styles.cameraPreview}
              facing="front"
              ref={cameraRef}
            />
          </View>
          <View style={styles.cameraActions}>
            <Pressable style={styles.cameraCancelBtn} onPress={() => setIsCameraVisible(false)}>
              <Feather name="x" size={24} color="#E23744" />
            </Pressable>
            <Pressable style={styles.cameraCaptureBtn} onPress={handleCapturePhoto}>
              <View style={styles.cameraCaptureInner} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topGradientBar: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    backgroundColor: THEME_EMERALD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  helpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  headerContainer: {
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  docList: {
    gap: 16,
    marginBottom: 32,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  docCardUploaded: {
    borderColor: THEME_EMERALD,
    backgroundColor: '#f8fafc',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  docInfo: {
    flex: 1,
  },
  bottomCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#000',
  },
  cameraModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A202C',
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraTitle: {
    color: '#FFF',
    marginBottom: 8,
  },
  cameraSubtitle: {
    color: '#A0AEC0',
    marginBottom: 40,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  cameraMask: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: '#10B981',
    marginBottom: 60,
  },
  cameraPreview: {
    flex: 1,
  },
  cameraActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    position: 'absolute',
    bottom: 50,
  },
  cameraCaptureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraCaptureInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FFF',
  },
  cameraCancelBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
