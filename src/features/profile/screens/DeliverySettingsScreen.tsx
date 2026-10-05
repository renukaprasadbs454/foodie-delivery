import React, { useEffect, useState, useRef } from 'react';
import {
  Linking,
  Switch,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  Platform,
  Image as RNImage,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Camera, CameraView } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';

import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { trackAnalyticsEvent } from '@/utils/analytics';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useTheme } from '@/hooks/useTheme';
import { selectUserId } from '../../auth/authSlice';
import { logoutDelivery } from '../../auth/session';
import {
  loadLocalPushRegistration,
  requestLocalPushRegistration,
  type LocalPushRegistration,
} from '../../notifications/pushRegistration';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { store } from '@/store/store';
import type { MainStackParamList } from '@/navigation/types';
import {
  loadLocalSettings,
  saveLocalSettings,
  type LocalDeliverySettings,
} from '../localSettings';

type Props = NativeStackScreenProps<MainStackParamList, 'DeliverySettings'>;

type PermissionState = 'GRANTED' | 'PROMPT' | 'DENIED' | 'CHECKING';

interface HardwarePermissions {
  camera: PermissionState;
  microphone: PermissionState;
  photos: PermissionState;
  location: PermissionState;
  notifications: PermissionState;
}

const THEME_EMERALD = '#14532D';

export function DeliverySettingsScreen(_props: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectUserId);

  const [settings, setSettings] = useState<LocalDeliverySettings>({
    notificationsEnabled: false,
  });
  const [pushRegistration, setPushRegistration] = useState<LocalPushRegistration>({
    permissionStatus: 'undetermined',
    deviceToken: null,
    lastPromptedAt: null,
    lastResolvedAt: null,
    lastUserId: null,
  });

  const [permissions, setPermissions] = useState<HardwarePermissions>({
    camera: 'CHECKING',
    microphone: 'CHECKING',
    photos: 'CHECKING',
    location: 'CHECKING',
    notifications: 'CHECKING',
  });

  const [isRefreshingPermissions, setIsRefreshingPermissions] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Testing Modals
  const [cameraTestVisible, setCameraTestVisible] = useState(false);
  const cameraRef = useRef<any>(null);
  const [capturedTestPhoto, setCapturedTestPhoto] = useState<string | null>(null);

  const [micTestVisible, setMicTestVisible] = useState(false);
  const [isMicRecording, setIsMicRecording] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [pickedImagePreview, setPickedImagePreview] = useState<string | null>(null);
  const [browserSettingsModal, setBrowserSettingsModal] = useState(false);

  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  // Check all permissions
  const checkAllPermissions = async () => {
    setIsRefreshingPermissions(true);
    const updated: HardwarePermissions = { ...permissions };

    try {
      // 1. Camera
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.permissions?.query) {
        try {
          const res = await navigator.permissions.query({ name: 'camera' as any });
          updated.camera = res.state === 'granted' ? 'GRANTED' : res.state === 'denied' ? 'DENIED' : 'PROMPT';
        } catch {
          updated.camera = 'PROMPT';
        }
      } else {
        const cam = await Camera.getCameraPermissionsAsync?.().catch(() => null);
        if (cam) {
          updated.camera = cam.granted ? 'GRANTED' : cam.canAskAgain ? 'PROMPT' : 'DENIED';
        } else {
          updated.camera = 'PROMPT';
        }
      }

      // 2. Microphone
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.permissions?.query) {
        try {
          const res = await navigator.permissions.query({ name: 'microphone' as any });
          updated.microphone = res.state === 'granted' ? 'GRANTED' : res.state === 'denied' ? 'DENIED' : 'PROMPT';
        } catch {
          updated.microphone = 'PROMPT';
        }
      } else {
        const mic = await Audio.getPermissionsAsync().catch(() => null);
        if (mic) {
          updated.microphone = mic.granted ? 'GRANTED' : mic.canAskAgain ? 'PROMPT' : 'DENIED';
        } else {
          updated.microphone = 'PROMPT';
        }
      }

      // 3. Photos / Media Library
      if (Platform.OS === 'web') {
        updated.photos = 'GRANTED'; // Web browsers allow file picker natively
      } else {
        const photo = await ImagePicker.getMediaLibraryPermissionsAsync().catch(() => null);
        if (photo) {
          updated.photos = photo.granted ? 'GRANTED' : photo.canAskAgain ? 'PROMPT' : 'DENIED';
        } else {
          updated.photos = 'PROMPT';
        }
      }

      // 4. Location
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.permissions?.query) {
        try {
          const res = await navigator.permissions.query({ name: 'geolocation' as any });
          updated.location = res.state === 'granted' ? 'GRANTED' : res.state === 'denied' ? 'DENIED' : 'PROMPT';
        } catch {
          updated.location = 'PROMPT';
        }
      } else {
        const loc = await Location.getForegroundPermissionsAsync().catch(() => null);
        if (loc) {
          updated.location = loc.granted ? 'GRANTED' : loc.canAskAgain ? 'PROMPT' : 'DENIED';
        } else {
          updated.location = 'PROMPT';
        }
      }

      // 5. Notifications
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'Notification' in window) {
        updated.notifications =
          Notification.permission === 'granted'
            ? 'GRANTED'
            : Notification.permission === 'denied'
            ? 'DENIED'
            : 'PROMPT';
      } else {
        const notif = await Notifications.getPermissionsAsync().catch(() => null);
        if (notif) {
          updated.notifications = notif.granted ? 'GRANTED' : notif.canAskAgain ? 'PROMPT' : 'DENIED';
        } else {
          updated.notifications = 'PROMPT';
        }
      }
    } catch (e) {
      console.warn('[Settings] Failed checking permissions:', e);
    } finally {
      setPermissions(updated);
      setIsRefreshingPermissions(false);
    }
  };

  useEffect(() => {
    trackAnalyticsEvent('delivery_settings_viewed');
    void loadLocalSettings().then((s) => {
      setSettings(s);
    });
    void loadLocalPushRegistration().then(setPushRegistration);
    void checkAllPermissions();
  }, []);

  // Request Individual Permissions
  const requestCamera = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        setPermissions((p) => ({ ...p, camera: 'GRANTED' }));
        setToast({ message: 'Camera permission granted successfully.', variant: 'success' });
        return;
      }
      const res = await Camera.requestCameraPermissionsAsync?.();
      const nextStatus = res?.granted ? 'GRANTED' : 'DENIED';
      setPermissions((p) => ({ ...p, camera: nextStatus }));
      setToast({
        message: nextStatus === 'GRANTED' ? 'Camera access granted.' : 'Camera permission denied.',
        variant: nextStatus === 'GRANTED' ? 'success' : 'warning',
      });
    } catch (err: any) {
      setToast({ message: `Camera error: ${err.message || 'Permission denied'}`, variant: 'error' });
    }
  };

  const requestMicrophone = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setPermissions((p) => ({ ...p, microphone: 'GRANTED' }));
        setToast({ message: 'Microphone permission granted successfully.', variant: 'success' });
        return;
      }
      const res = await Audio.requestPermissionsAsync();
      const nextStatus = res.granted ? 'GRANTED' : 'DENIED';
      setPermissions((p) => ({ ...p, microphone: nextStatus }));
      setToast({
        message: nextStatus === 'GRANTED' ? 'Microphone access granted.' : 'Microphone permission denied.',
        variant: nextStatus === 'GRANTED' ? 'success' : 'warning',
      });
    } catch (err: any) {
      setToast({ message: `Microphone error: ${err.message || 'Permission denied'}`, variant: 'error' });
    }
  };

  const requestPhotos = async () => {
    try {
      if (Platform.OS === 'web') {
        setPermissions((p) => ({ ...p, photos: 'GRANTED' }));
        setToast({ message: 'Photos & Media access is active.', variant: 'success' });
        return;
      }
      const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const nextStatus = res.granted ? 'GRANTED' : 'DENIED';
      setPermissions((p) => ({ ...p, photos: nextStatus }));
      setToast({
        message: nextStatus === 'GRANTED' ? 'Photos access granted.' : 'Photos permission denied.',
        variant: nextStatus === 'GRANTED' ? 'success' : 'warning',
      });
    } catch (err: any) {
      setToast({ message: `Photos error: ${err.message || 'Permission denied'}`, variant: 'error' });
    }
  };

  const requestLocation = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setPermissions((p) => ({ ...p, location: 'GRANTED' }));
            setToast({ message: 'Location GPS permission granted successfully.', variant: 'success' });
          },
          (err) => {
            setPermissions((p) => ({ ...p, location: 'DENIED' }));
            setToast({ message: `Location error: ${err.message}`, variant: 'warning' });
          }
        );
        return;
      }
      const res = await Location.requestForegroundPermissionsAsync();
      const nextStatus = res.granted ? 'GRANTED' : 'DENIED';
      setPermissions((p) => ({ ...p, location: nextStatus }));
      setToast({
        message: nextStatus === 'GRANTED' ? 'Location GPS access granted.' : 'Location permission denied.',
        variant: nextStatus === 'GRANTED' ? 'success' : 'warning',
      });
    } catch (err: any) {
      setToast({ message: `Location error: ${err.message || 'Permission denied'}`, variant: 'error' });
    }
  };

  const requestAllPermissions = async () => {
    setToast({ message: 'Checking & requesting all hardware permissions...', variant: 'info' });
    await requestCamera();
    await requestMicrophone();
    await requestPhotos();
    await requestLocation();
    await checkAllPermissions();
  };

  // Test Camera
  const handleTestCamera = () => {
    setCapturedTestPhoto(null);
    setCameraTestVisible(true);
  };

  const handleCaptureTestPhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
        if (photo?.uri) {
          setCapturedTestPhoto(photo.uri);
          setToast({ message: 'Test photo captured successfully!', variant: 'success' });
        }
      } catch {
        setToast({ message: 'Failed to capture photo.', variant: 'error' });
      }
    }
  };

  // Test Microphone
  const startMicTest = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
        (status) => {
          if (status.isRecording && status.metering !== undefined) {
            // Normalize metering (-160 to 0) to (0 to 100)
            const level = Math.max(0, Math.min(100, Math.round((status.metering + 80) * 1.25)));
            setMicLevel(level);
          }
        },
        100
      );

      recordingRef.current = recording;
      setIsMicRecording(true);
      setToast({ message: 'Listening to microphone input...', variant: 'info' });
    } catch (err: any) {
      setToast({ message: `Mic test error: ${err.message || 'Could not record'}`, variant: 'error' });
      setIsMicRecording(false);
    }
  };

  const stopMicTest = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      } catch {
        // Ignored
      }
    }
    setIsMicRecording(false);
    setMicLevel(0);
    setToast({ message: 'Microphone test completed.', variant: 'success' });
  };

  // Test Photo Picker
  const handleTestPhotoPicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPickedImagePreview(result.assets[0].uri);
        setToast({ message: 'Photo selected from library successfully!', variant: 'success' });
      }
    } catch (err: any) {
      setToast({ message: `Gallery error: ${err.message || 'Failed picking image'}`, variant: 'error' });
    }
  };

  // Notifications Toggle
  const onToggleNotifications = async (value: boolean) => {
    const next = { ...settings, notificationsEnabled: value };
    setSettings(next);
    await saveLocalSettings(next);
    if (value && userId) {
      const registration = await requestLocalPushRegistration(userId);
      setPushRegistration(registration);
      setPermissions((p) => ({
        ...p,
        notifications: registration.permissionStatus === 'granted' ? 'GRANTED' : 'DENIED',
      }));
      setToast({
        message:
          registration.permissionStatus === 'granted'
            ? 'Push alerts activated on this device.'
            : 'Notification permission is not granted. You can enable it from system settings.',
        variant: registration.permissionStatus === 'granted' ? 'success' : 'warning',
      });
      return;
    }
    setToast({ message: 'Push alerts disabled.', variant: 'info' });
  };

  // Logout
  const onLogout = async () => {
    setLoggingOut(true);
    trackAnalyticsEvent('logout_tapped');
    try {
      await logoutDelivery(dispatch, store.getState.bind(store));
    } finally {
      setLoggingOut(false);
      setLogoutVisible(false);
    }
  };

  // Count active permissions
  const activeCount = [
    permissions.camera === 'GRANTED',
    permissions.microphone === 'GRANTED',
    permissions.photos === 'GRANTED',
    permissions.location === 'GRANTED',
    permissions.notifications === 'GRANTED',
  ].filter(Boolean).length;

  const renderBadge = (status: PermissionState) => {
    if (status === 'GRANTED') {
      return (
        <View style={styles.badgeGranted}>
          <Feather name="check" size={12} color="#15803D" style={{ marginRight: 4 }} />
          <Text style={styles.badgeGrantedText}>GRANTED</Text>
        </View>
      );
    }
    if (status === 'PROMPT') {
      return (
        <View style={styles.badgePrompt}>
          <Feather name="alert-circle" size={12} color="#B45309" style={{ marginRight: 4 }} />
          <Text style={styles.badgePromptText}>PROMPT</Text>
        </View>
      );
    }
    if (status === 'DENIED') {
      return (
        <View style={styles.badgeDenied}>
          <Feather name="x" size={12} color="#DC2626" style={{ marginRight: 4 }} />
          <Text style={styles.badgeDeniedText}>DENIED</Text>
        </View>
      );
    }
    return (
      <View style={styles.badgeChecking}>
        <ActivityIndicator size="small" color="#64748B" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topArch} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>App preferences, hardware access, & permissions</Text>
        </View>

        {/* Top Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardTop}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="shield-checkmark" size={24} color="#15803D" />
            </View>
            <View style={styles.summaryTextContent}>
              <Text style={styles.summaryTitle}>Hardware & System Access</Text>
              <Text style={styles.summarySubtitle}>
                {activeCount} of 5 essential permissions active
              </Text>
            </View>
            <Pressable
              style={styles.refreshIconBtn}
              onPress={() => void checkAllPermissions()}
              disabled={isRefreshingPermissions}
            >
              {isRefreshingPermissions ? (
                <ActivityIndicator size="small" color="#14532D" />
              ) : (
                <Ionicons name="sync" size={20} color="#64748B" />
              )}
            </Pressable>
          </View>

          <Pressable style={styles.allowAllBtn} onPress={() => void requestAllPermissions()}>
            <Ionicons name="flash" size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.allowAllBtnText}>Allow / Check All Permissions</Text>
          </Pressable>
        </View>

        {/* Section Title */}
        <Text style={styles.sectionHeader}>HARDWARE & APP PERMISSIONS</Text>

        <View style={styles.settingsGroupList}>
          {/* 1. Camera Access */}
          <View style={styles.settingCard}>
            <View style={styles.settingCardHeader}>
              <View style={[styles.settingIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="camera" size={22} color="#D97706" />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={styles.settingTitle}>Camera Access</Text>
                <Text style={styles.settingSubtitle}>
                  Required for scanning order OTP barcodes, proof of delivery photos, and KYC verification.
                </Text>
              </View>
              {renderBadge(permissions.camera)}
            </View>

            <View style={styles.settingActionRow}>
              {permissions.camera === 'GRANTED' ? (
                <Pressable style={styles.testPillBtn} onPress={handleTestCamera}>
                  <Ionicons name="eye-outline" size={16} color="#334155" style={{ marginRight: 6 }} />
                  <Text style={styles.testPillBtnText}>Test Camera</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.grantBtn} onPress={() => void requestCamera()}>
                  <Text style={styles.grantBtnText}>Grant Access</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* 2. Microphone Access */}
          <View style={styles.settingCard}>
            <View style={styles.settingCardHeader}>
              <View style={[styles.settingIconBox, { backgroundColor: '#D1FAE5' }]}>
                <Ionicons name="mic" size={22} color="#059669" />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={styles.settingTitle}>Microphone Access</Text>
                <Text style={styles.settingSubtitle}>
                  Enables VoIP calling to customers upon arrival and recording voice notes for support dispatch.
                </Text>
              </View>
              {renderBadge(permissions.microphone)}
            </View>

            <View style={styles.settingActionRow}>
              {permissions.microphone === 'GRANTED' ? (
                <Pressable style={styles.testPillBtn} onPress={() => setMicTestVisible(true)}>
                  <Ionicons name="mic-outline" size={16} color="#334155" style={{ marginRight: 6 }} />
                  <Text style={styles.testPillBtnText}>Test Microphone</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.grantBtn} onPress={() => void requestMicrophone()}>
                  <Text style={styles.grantBtnText}>Grant Access</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* 3. Photos & Media Library */}
          <View style={styles.settingCard}>
            <View style={styles.settingCardHeader}>
              <View style={[styles.settingIconBox, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="images" size={22} color="#2563EB" />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={styles.settingTitle}>Photos & Media Library</Text>
                <Text style={styles.settingSubtitle}>
                  Allows selecting saved identification, driving license, and vehicle RC documents from gallery.
                </Text>
              </View>
              {renderBadge(permissions.photos)}
            </View>

            <View style={styles.settingActionRow}>
              {permissions.photos === 'GRANTED' ? (
                <Pressable style={styles.testPillBtn} onPress={() => void handleTestPhotoPicker()}>
                  <Ionicons name="image-outline" size={16} color="#334155" style={{ marginRight: 6 }} />
                  <Text style={styles.testPillBtnText}>Test Photo Picker</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.grantBtn} onPress={() => void requestPhotos()}>
                  <Text style={styles.grantBtnText}>Grant Access</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* 4. Location Services (GPS) */}
          <View style={styles.settingCard}>
            <View style={styles.settingCardHeader}>
              <View style={[styles.settingIconBox, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons name="location" size={22} color="#DB2777" />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={styles.settingTitle}>Location Services (GPS)</Text>
                <Text style={styles.settingSubtitle}>
                  Required for real-time delivery offer dispatching, live tracking, and turn-by-turn routing.
                </Text>
              </View>
              {renderBadge(permissions.location)}
            </View>

            <View style={styles.settingActionRow}>
              {permissions.location === 'GRANTED' ? (
                <View style={styles.activeGpsRow}>
                  <Ionicons name="checkmark-done-circle" size={18} color="#16A34A" style={{ marginRight: 6 }} />
                  <Text style={styles.activeGpsText}>Live Background GPS Active</Text>
                </View>
              ) : (
                <Pressable style={styles.grantBtn} onPress={() => void requestLocation()}>
                  <Text style={styles.grantBtnText}>Grant Access</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* 5. Push Notifications */}
          <View style={styles.settingCard}>
            <View style={styles.settingCardHeader}>
              <View style={[styles.settingIconBox, { backgroundColor: '#EDE9FE' }]}>
                <Ionicons name="notifications" size={22} color="#7C3AED" />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSubtitle}>
                  Instant sound alerts for new delivery orders, route shifts, and wallet payouts.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {renderBadge(permissions.notifications)}
                <Switch
                  value={settings.notificationsEnabled}
                  onValueChange={(v) => {
                    void onToggleNotifications(v);
                  }}
                  trackColor={{ false: '#CBD5E0', true: '#F59E0B' }}
                  thumbColor="#FFF"
                />
              </View>
            </View>
          </View>

          {/* 6. Device System Settings */}
          <Pressable
            style={styles.settingCard}
            onPress={() => {
              if (Platform.OS === 'web') {
                setBrowserSettingsModal(true);
              } else {
                void Linking.openSettings();
              }
            }}
          >
            <View style={styles.settingCardHeader}>
              <View style={[styles.settingIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="options" size={22} color="#475569" />
              </View>
              <View style={styles.settingTextContent}>
                <Text style={styles.settingTitle}>Device System Settings</Text>
                <Text style={styles.settingSubtitle}>
                  {Platform.OS === 'web'
                    ? 'Manage browser site permissions (Address Bar Settings)'
                    : 'Manage OS-level permissions'}
                </Text>
              </View>
              <Feather name="external-link" size={18} color="#A0AEC0" />
            </View>
          </Pressable>

          {/* Sign Out Button */}
          <Pressable style={styles.logoutButton} onPress={() => setLogoutVisible(true)}>
            <Feather name="log-out" size={20} color="#E23744" />
            <Text style={styles.logoutButtonText}>Sign Out Securely</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* EXACT CIRCULAR CAMERA TEST MODAL */}
      <Modal
        visible={cameraTestVisible}
        onRequestClose={() => setCameraTestVisible(false)}
        animationType="fade"
      >
        <View style={styles.cameraModal}>
          <Text style={styles.cameraTitle}>Identity Verification</Text>
          <Text style={styles.cameraSubtitle}>Position your face in the circle to test camera</Text>

          <View style={styles.cameraMask}>
            {capturedTestPhoto ? (
              <RNImage
                source={{ uri: capturedTestPhoto }}
                style={styles.cameraPreview}
                resizeMode="cover"
              />
            ) : (
              <CameraView
                style={styles.cameraPreview}
                facing="front"
                ref={cameraRef}
              />
            )}
          </View>

          {capturedTestPhoto ? (
            <View style={styles.cameraActions}>
              <Pressable
                style={styles.cameraCancelBtn}
                onPress={() => setCapturedTestPhoto(null)}
              >
                <Feather name="refresh-cw" size={24} color="#FFF" />
              </Pressable>
              <Pressable
                style={[styles.cameraCaptureBtn, { backgroundColor: '#10B981', borderColor: '#10B981' }]}
                onPress={() => {
                  setCameraTestVisible(false);
                  setToast({ message: 'Camera test completed successfully!', variant: 'success' });
                }}
              >
                <Feather name="check" size={32} color="#FFF" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.cameraActions}>
              <Pressable
                style={styles.cameraCancelBtn}
                onPress={() => setCameraTestVisible(false)}
              >
                <Feather name="x" size={24} color="#E23744" />
              </Pressable>
              <Pressable style={styles.cameraCaptureBtn} onPress={handleCaptureTestPhoto}>
                <View style={styles.cameraCaptureInner} />
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      {/* MICROPHONE TEST MODAL */}
      <Modal
        visible={micTestVisible}
        onRequestClose={() => {
          void stopMicTest();
          setMicTestVisible(false);
        }}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalIconBox,
                { backgroundColor: isMicRecording ? '#DCFCE7' : '#D1FAE5' },
              ]}
            >
              <Ionicons
                name={isMicRecording ? 'mic' : 'mic-outline'}
                size={36}
                color={isMicRecording ? '#15803D' : '#059669'}
              />
            </View>
            <Text style={styles.modalTitle}>Microphone Diagnostic</Text>
            <Text style={styles.modalBody}>
              {isMicRecording
                ? 'Speak into your device. Watch the meter react to your voice.'
                : 'Press Start Test to check your microphone levels for customer calling.'}
            </Text>

            {/* Audio Level Meter */}
            <View style={styles.meterContainer}>
              <View style={[styles.meterFill, { width: `${Math.max(5, isMicRecording ? micLevel : 0)}%` }]} />
            </View>
            <Text style={styles.meterLabel}>Input Level: {isMicRecording ? `${micLevel}%` : '0%'}</Text>

            <View style={styles.modalButtonGroup}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => {
                  void stopMicTest();
                  setMicTestVisible(false);
                }}
              >
                <Text style={styles.modalCancelText}>Close</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalConfirmBtn,
                  { backgroundColor: isMicRecording ? '#DC2626' : THEME_EMERALD },
                ]}
                onPress={() => {
                  if (isMicRecording) {
                    void stopMicTest();
                  } else {
                    void startMicTest();
                  }
                }}
              >
                <Text style={styles.modalConfirmText}>{isMicRecording ? 'Stop Test' : 'Start Test'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* PICKED IMAGE PREVIEW MODAL */}
      <Modal
        visible={Boolean(pickedImagePreview)}
        onRequestClose={() => setPickedImagePreview(null)}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Photo Picker Working</Text>
            <Text style={styles.modalBody}>Selected image loaded successfully from device storage.</Text>
            {pickedImagePreview && (
              <RNImage
                source={{ uri: pickedImagePreview }}
                style={{ width: 220, height: 160, borderRadius: 12, marginBottom: 20 }}
                resizeMode="cover"
              />
            )}
            <Pressable style={styles.modalConfirmBtn} onPress={() => setPickedImagePreview(null)}>
              <Text style={styles.modalConfirmText}>Dismiss</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* BROWSER SETTINGS HELP MODAL (WEB) */}
      <Modal
        visible={browserSettingsModal}
        onRequestClose={() => setBrowserSettingsModal(false)}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalIconBox, { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="lock-closed" size={32} color="#475569" />
            </View>
            <Text style={styles.modalTitle}>Browser Permissions</Text>
            <Text style={styles.modalBody}>
              To manage permissions in your browser:
              {'\n\n'}1. Look at the left side of your browser's address bar.
              {'\n'}2. Click the <Text style={{ fontWeight: 'bold' }}>Tune / Padlock icon</Text>.
              {'\n'}3. Toggle <Text style={{ fontWeight: 'bold' }}>Camera, Microphone, and Location</Text> to "Allow".
              {'\n'}4. Refresh the page to apply changes.
            </Text>
            <Pressable style={styles.modalConfirmBtn} onPress={() => setBrowserSettingsModal(false)}>
              <Text style={styles.modalConfirmText}>Got it</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal
        visible={logoutVisible}
        onRequestClose={() => setLogoutVisible(false)}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconBox}>
              <Feather name="log-out" size={32} color="#E23744" />
            </View>
            <Text style={styles.modalTitle}>Ready to leave?</Text>
            <Text style={styles.modalBody}>
              You will need to sign in again to accept incoming deliveries.
            </Text>
            <View style={styles.modalButtonGroup}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setLogoutVisible(false)}
                disabled={loggingOut}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmBtn}
                onPress={() => void onLogout()}
                disabled={loggingOut}
              >
                <Text style={styles.modalConfirmText}>{loggingOut ? 'Signing out...' : 'Log Out'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topArch: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 180,
    backgroundColor: THEME_EMERALD,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#A7F3D0',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  summaryCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  summaryTextContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  summarySubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  refreshIconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  allowAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME_EMERALD,
    height: 48,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  allowAllBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#64748B',
    marginBottom: 14,
    marginLeft: 4,
  },
  settingsGroupList: {
    gap: 14,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  settingCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  settingIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingTextContent: {
    flex: 1,
    paddingRight: 8,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '400',
  },
  settingActionRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  badgeGranted: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeGrantedText: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePromptText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeDenied: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDeniedText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badgeChecking: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  testPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  testPillBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  grantBtn: {
    backgroundColor: THEME_EMERALD,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  grantBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activeGpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeGpsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(226, 55, 68, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(226, 55, 68, 0.25)',
    borderRadius: 20,
    height: 56,
    marginTop: 16,
    gap: 12,
  },
  logoutButtonText: {
    color: '#E23744',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 10,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(226, 55, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalBody: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  meterContainer: {
    width: '100%',
    height: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 8,
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 7,
  },
  meterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 24,
  },
  modalButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E23744',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
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
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  cameraSubtitle: {
    color: '#A0AEC0',
    fontSize: 13,
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
    backgroundColor: '#000',
  },
  cameraPreview: {
    width: '100%',
    height: '100%',
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
  },
});
