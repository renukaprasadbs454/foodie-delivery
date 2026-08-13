import React, { useEffect, useState } from 'react';
import { ScrollView, View, TextInput, ActivityIndicator } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
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
import { useGetDeliveryProfileQuery, useUpsertDeliveryProfileMutation, useUploadDeliveryProfileImageMutation } from '../../../api/endpoints/deliveryApi';
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
  const profileQuery = useGetDeliveryProfileQuery();
  const [upsertProfile] = useUpsertDeliveryProfileMutation();
  const [uploadImage] = useUploadDeliveryProfileImageMutation();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameText, setEditNameText] = useState('');
  const [isSavingName, setIsSavingName] = useState(false);

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      // Refetch from server immediately so the signed URL persists across navigation
      await profileQuery.refetch();
      trackAnalyticsEvent('photo_uploaded');
      trackAnalyticsEvent('profile_image_uploaded');
      setToast({ message: 'Photo uploaded.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  const initials = userId ? userId.slice(0, 2).toUpperCase() : 'DP';

  let finalImgUri = profileQuery.data?.profileImageUrl ?? null;
  if (finalImgUri) {
    const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
    if (finalImgUri.includes('localhost') && apiBaseUrl) {
      const hostMatch = apiBaseUrl.match(/:\/\/(.[^:/]+)/);
      if (hostMatch && hostMatch[1]) {
        finalImgUri = finalImgUri.replace('localhost', hostMatch[1]);
      }
    } else if (finalImgUri.startsWith('/') && apiBaseUrl) {
      finalImgUri = `${apiBaseUrl.replace(/\/$/, '')}${finalImgUri}`;
    }
  }

  const handleSaveName = async () => {
    if (!editNameText.trim()) {
      setIsEditingName(false);
      return;
    }
    setIsSavingName(true);
    try {
      await upsertProfile({ fullName: editNameText.trim(), vehicleType: 'BIKE', vehicleNumber: '' }).unwrap();
      setToast({ message: 'Name updated successfully', variant: 'success' });
      setIsEditingName(false);
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topArch, { height: 180 }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account and settings</Text>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Avatar
              uri={finalImgUri}
              initials={initials}
              size={96}
              accessibilityLabel="Profile avatar"
            />
            <Pressable
              style={styles.editImageBtn}
              onPress={() => {
                void onPickPhoto();
              }}
              accessibilityLabel="Upload photo"
            >
              <Feather name="camera" size={16} color="#FFF" />
            </Pressable>
          </View>

          <View style={styles.nameRow}>
            {isEditingName ? (
              <View style={styles.editNameContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={editNameText}
                  onChangeText={setEditNameText}
                  autoFocus
                  placeholder="Enter your name"
                />
                {isSavingName ? (
                  <ActivityIndicator size="small" color="#F59E0B" style={{ marginLeft: 8 }} />
                ) : (
                  <Pressable onPress={handleSaveName} style={styles.saveNameBtn}>
                    <Feather name="check" size={20} color="#14532D" />
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.profileName}>
                  {profileQuery.data?.fullName && profileQuery.data.fullName !== 'Delivery Partner'
                    ? profileQuery.data.fullName
                    : 'Delivery Partner'}
                </Text>
                <Pressable onPress={() => {
                  setEditNameText(profileQuery.data?.fullName && profileQuery.data.fullName !== 'Delivery Partner' ? profileQuery.data.fullName : '');
                  setIsEditingName(true);
                }} style={{ marginLeft: 8, marginTop: -4 }}>
                  <Feather name="edit-2" size={16} color="#A0AEC0" />
                </Pressable>
              </View>
            )}
          </View>
          <Text style={styles.profileRole}>{userType ?? 'DELIVERY_PARTNER'}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Feather name="shield" size={18} color="#F59E0B" />
            <Text style={styles.infoCardTitle}>Account Details</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{userId ?? '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>System Status</Text>
            <Text style={styles.infoValueSuccess}>Verified</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Quick Actions</Text>

        <Pressable
          style={styles.actionCard}
          onPress={() => navigation.navigate('DeliverySettings')}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.1)' }]}>
            <Feather name="settings" size={24} color="#38bdf8" />
          </View>
          <View style={styles.actionTextContent}>
            <Text style={styles.actionTitle}>Settings</Text>
            <Text style={styles.actionSubtitle}>App preferences and sign out</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#A0AEC0" />
        </Pressable>

        <Pressable
          style={styles.actionCard}
          onPress={() => navigation.navigate('Wallet')}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
            <Feather name="dollar-sign" size={24} color="#14532D" />
          </View>
          <View style={styles.actionTextContent}>
            <Text style={styles.actionTitle}>Wallet</Text>
            <Text style={styles.actionSubtitle}>Balance, ledger and payouts</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#A0AEC0" />
        </Pressable>

      </ScrollView>

      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast'}
        onDismiss={() => setToast(null)}
      />
    </SafeAreaView>
  );
}

import { StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  topArch: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: '#14532D',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 4,
    marginTop: -20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 10,
    elevation: 10,
  },
  editImageBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#F59E0B',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  nameRow: {
    marginBottom: 4,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#F59E0B',
    fontSize: 20,
    fontWeight: '800',
    color: '#1A202C',
    paddingVertical: 2,
    minWidth: 150,
    textAlign: 'center',
  },
  saveNameBtn: {
    marginLeft: 8,
    backgroundColor: '#dcfce7',
    padding: 6,
    borderRadius: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 13,
    color: '#A0AEC0',
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  infoCard: {
    backgroundColor: '#14532D',
    borderRadius: 24,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#323438',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600',
    maxWidth: 160,
  },
  infoValueSuccess: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#323438',
    marginVertical: 12,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
});
