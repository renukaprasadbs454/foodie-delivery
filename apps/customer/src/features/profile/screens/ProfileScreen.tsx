import React, { useEffect, useState, useRef } from 'react';
import { RefreshControl, ScrollView, View, Pressable, Animated, TextInput as RNTextInput, Image } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Avatar,
  Text,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useGetMyProfileQuery,
  useUploadProfileImageMutation,
  useUpdateMyProfileMutation,
} from '../../../api/endpoints/usersApi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toUnwrappedApiError } from '../../auth/apiError';
import type { ProfileStackParamList } from '../../../navigation/types';
import { ProfileSkeleton } from '../components/ProfileSkeleton';
import { initialsFromName } from '../types';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useAppDispatch } from '../../../store/hooks';
import { clearCredentials } from '../../auth/authSlice';

const PRESET_AVATARS = [
  'https://img.icons8.com/color/150/user-male-circle.png',
  'https://img.icons8.com/color/150/user-female-circle.png',
  'https://img.icons8.com/color/150/gender-neutral-user.png',
  'https://img.icons8.com/color/150/circled-user-male-skin-type-1-2.png',
  'https://img.icons8.com/color/150/circled-user-female-skin-type-4.png',
  'https://img.icons8.com/color/150/circled-user-male-skin-type-6.png',
  'https://img.icons8.com/color/150/businessman.png',
  'https://img.icons8.com/color/150/businesswoman.png',
  'https://img.icons8.com/color/150/student-male.png',
  'https://img.icons8.com/color/150/user-female-skin-type-7.png',
];

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const profileQuery = useGetMyProfileQuery();
  const [uploadImage, uploadState] = useUploadProfileImageMutation();
  const [updateProfile, updateState] = useUpdateMyProfileMutation();
  const dispatch = useAppDispatch();

  const fullNameVal = profileQuery.data?.fullName || 'Foodie User';
  const phoneVal = profileQuery.data?.phoneNumber || '—';

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nameVal, setNameVal] = useState('');
  const [emailVal, setEmailVal] = useState('');

  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const scaleValue = useRef(new Animated.Value(0.9)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) => setToast({ message: error.message, variant: 'error' }),
    onInlineField: (error) => setToast({ message: error.message, variant: 'error' }),
    onFullScreen: (error) => setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) => setToast({ message: error.message, variant: 'error' }),
  });

  useEffect(() => {
    trackAnalyticsEvent('customer_profile_viewed');
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    if (profileQuery.data) {
      setNameVal(profileQuery.data.fullName || '');
      setEmailVal(profileQuery.data.email || '');
    }
  }, [profileQuery.data]);

  useEffect(() => {
    if (phoneVal && phoneVal !== '—') {
      AsyncStorage.getItem('user_avatar_' + phoneVal).then((val) => {
        if (val) {
          setAvatarUri(val);
        }
      }).catch(() => { });
    }
  }, [phoneVal]);

  const onSelectPresetAvatar = async (imageUrl: string) => {
    try {
      setAvatarUri(imageUrl);
      if (phoneVal && phoneVal !== '—') {
        await AsyncStorage.setItem('user_avatar_' + phoneVal, imageUrl);
      }
      trackAnalyticsEvent('preset_avatar_selected');
      setToast({ message: 'Avatar updated.', variant: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to save avatar.', variant: 'error' });
    }
  };

  const handleAvatarTap = () => {
    const currentAvatar = avatarUri || profileQuery.data?.profileImageUrl || PRESET_AVATARS[0];
    const currentIndex = PRESET_AVATARS.findIndex((url) => url === currentAvatar);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % PRESET_AVATARS.length;
    void onSelectPresetAvatar(PRESET_AVATARS[nextIndex]);
  };

  const handleSave = async () => {
    if (!isConnected) {
      setToast({ message: 'Connect to the internet to save changes.', variant: 'warning' });
      return;
    }
    if (!nameVal.trim()) {
      setToast({ message: 'Full name cannot be empty.', variant: 'error' });
      return;
    }
    try {
      await updateProfile({
        fullName: nameVal.trim(),
        email: emailVal.trim(),
      }).unwrap();
      setIsEditing(false);
      setToast({ message: 'Profile updated successfully.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  const handleLogout = () => {
    dispatch(clearCredentials());
    trackAnalyticsEvent('customer_logout');
    setToast({ message: 'Logged out successfully.', variant: 'success' });
  };



  return (
    <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      {/* Curved Dark Green brand banner top arch with smooth gradient */}
      <LinearGradient
        colors={['#0F3E22', '#14532D', '#1B6A3A']}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 310,
          borderBottomLeftRadius: 40,
          borderBottomRightRadius: 40,
        }}
      />

      {/* Inline floating edit button */}
      <View style={{ position: 'absolute', top: insets.top + 16, right: 16, zIndex: 10, flexDirection: 'row', alignItems: 'center' }}>
        {isEditing && (
          <Pressable
            onPress={() => {
              setIsEditing(false);
              if (profileQuery.data) {
                setNameVal(profileQuery.data.fullName || '');
                setEmailVal(profileQuery.data.email || '');
              }
            }}
            style={{ marginRight: 8, backgroundColor: 'rgba(255, 255, 255, 0.15)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>Cancel</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            if (isEditing) {
              void handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          disabled={updateState.isLoading}
          style={({ pressed }) => ({
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#FCD34D',
            flexDirection: 'row',
            alignItems: 'center',
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Feather name={isEditing ? "check" : "edit-2"} size={14} color="#FCD34D" style={{ marginRight: 6 }} />
          <Text style={{ color: '#FCD34D', fontWeight: '800', fontSize: 13 }}>
            {isEditing ? (updateState.isLoading ? 'Saving...' : 'Save') : 'Edit'}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 60, paddingTop: insets.top + 16 }}
        refreshControl={
          <RefreshControl
            refreshing={profileQuery.isFetching}
            onRefresh={() => { void profileQuery.refetch(); }}
            tintColor="#FCD34D"
          />
        }
      >
        <Animated.View style={{ opacity: fadeValue, transform: [{ scale: scaleValue }], paddingHorizontal: tokens.spacing.lg }}>
          <View style={{ paddingTop: 16, paddingBottom: 20 }}>
            <Text style={{ fontSize: 34, fontWeight: '900', color: '#FCD34D', letterSpacing: 0.5 }}>Profile</Text>
          </View>

          {/* iOS Profile Avatar header inside the dark green arch */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Pressable
              disabled={uploadState.isLoading}
              onPress={handleAvatarTap}
              style={({ pressed }) => ({
                width: 104,
                height: 104,
                borderRadius: 52,
                backgroundColor: '#FFFFFF',
                borderWidth: 3,
                borderColor: '#FCD34D', // Premium gold accent border
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5,
                position: 'relative',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Avatar
                uri={avatarUri || profileQuery.data?.profileImageUrl}
                initials={initialsFromName(fullNameVal)}
                size={94}
                accessibilityLabel="Profile avatar"
              />
              {/* Subtle tap-to-swap icon layout */}
              <View style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: '#FCD34D',
                width: 30,
                height: 30,
                borderRadius: 15,
                borderWidth: 2,
                borderColor: '#14532D',
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 3,
              }}>
                <Feather name="refresh-cw" size={13} color="#14532D" />
              </View>
            </Pressable>

            <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }}>
              {fullNameVal}
            </Text>
            <Text style={{ fontSize: 15, color: '#A7F3D0', fontWeight: '600' }}>
              {phoneVal}
            </Text>
          </View>

          {!isConnected && (
            <View style={{ marginBottom: 16 }}>
              <Text variant="caption" color={tokens.color.warning}>
                Offline — showing cached profile.
              </Text>
            </View>
          )}

          {profileQuery.isLoading && !profileQuery.data ? (
            <View style={{ paddingVertical: tokens.spacing.lg }}>
              <ProfileSkeleton />
            </View>
          ) : (
            <View style={{ marginTop: 12 }}>
              {/* Grouped Info Item Details */}
              <Text style={{ fontSize: 13, textTransform: 'uppercase', color: '#14532D', fontWeight: '800', letterSpacing: 0.8, marginLeft: 16, marginBottom: 8 }}>
                Account Information
              </Text>

              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                marginBottom: 24,
                overflow: 'hidden',
                shadowColor: '#14532D',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}>
                {/* Full name editable row */}
                <View style={{ paddingHorizontal: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="user" size={20} color="#14532D" style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: '600', flex: 1 }}>Name</Text>
                  {isEditing ? (
                    <RNTextInput
                      value={nameVal}
                      onChangeText={setNameVal}
                      style={{
                        fontSize: 16,
                        color: '#111827',
                        fontWeight: '700',
                        textAlign: 'right',
                        borderBottomWidth: 1,
                        borderBottomColor: '#FCD34D',
                        paddingVertical: 2,
                        minWidth: 150,
                      }}
                      placeholder="Name"
                      accessibilityLabel="Edit Name input"
                    />
                  ) : (
                    <Text style={{ fontSize: 16, color: '#111827', fontWeight: '700' }}>{fullNameVal}</Text>
                  )}
                </View>
                <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 48 }} />

                {/* Email address editable row */}
                <View style={{ paddingHorizontal: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="mail" size={20} color="#14532D" style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: '600', flex: 1 }}>Email</Text>
                  {isEditing ? (
                    <RNTextInput
                      value={emailVal}
                      onChangeText={setEmailVal}
                      style={{
                        fontSize: 16,
                        color: '#111827',
                        fontWeight: '700',
                        textAlign: 'right',
                        borderBottomWidth: 1,
                        borderBottomColor: '#FCD34D',
                        paddingVertical: 2,
                        minWidth: 150,
                      }}
                      placeholder="Email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      accessibilityLabel="Edit Email input"
                    />
                  ) : (
                    <Text style={{ fontSize: 16, color: '#111827', fontWeight: '700' }}>{emailVal}</Text>
                  )}
                </View>
                <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 48 }} />

                {/* READ-ONLY mobile number is NEVER editable */}
                <View style={{ paddingHorizontal: 16, paddingVertical: 18, flexDirection: 'row', alignItems: 'center', opacity: 0.7 }}>
                  <Feather name="phone" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: '600', flex: 1 }}>Mobile (Locked)</Text>
                  <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: '700' }}>{phoneVal}</Text>
                </View>
              </View>

              {/* Grouped Links */}
              <Text style={{ fontSize: 13, textTransform: 'uppercase', color: '#14532D', fontWeight: '800', letterSpacing: 0.8, marginLeft: 16, marginBottom: 8 }}>
                Preferences
              </Text>

              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                marginBottom: 24,
                overflow: 'hidden',
                shadowColor: '#14532D',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}>
                <Pressable
                  onPress={() => navigation.navigate('Addresses', {})}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 18,
                    backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
                  })}
                >
                  <Feather name="map-pin" size={20} color="#14532D" style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 17, color: '#111827', fontWeight: '600', flex: 1 }}>Delivery Addresses</Text>
                  <Text style={{ fontSize: 20, color: '#FCD34D', fontWeight: 'bold' }}>›</Text>
                </Pressable>
                <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 48 }} />

                <Pressable
                  onPress={() => navigation.navigate('Settings')}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 18,
                    backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
                  })}
                >
                  <Feather name="settings" size={20} color="#14532D" style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 17, color: '#111827', fontWeight: '600', flex: 1 }}>App Settings</Text>
                  <Text style={{ fontSize: 20, color: '#FCD34D', fontWeight: 'bold' }}>›</Text>
                </Pressable>
              </View>

              {/* Grouped Legal & Policies Links */}
              <Text style={{ fontSize: 13, textTransform: 'uppercase', color: '#14532D', fontWeight: '800', letterSpacing: 0.8, marginLeft: 16, marginBottom: 8 }}>
                Legal & Policies
              </Text>

              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                marginBottom: 24,
                overflow: 'hidden',
                shadowColor: '#14532D',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}>
                <Pressable
                  onPress={() => {
                    setToast({
                      message: 'Terms & Conditions: Service usage agreement. Subject to standard Foodie terms.',
                      variant: 'info'
                    });
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 18,
                    backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
                  })}
                >
                  <Feather name="file-text" size={20} color="#14532D" style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 17, color: '#111827', fontWeight: '600', flex: 1 }}>Terms & Conditions</Text>
                  <Text style={{ fontSize: 20, color: '#FCD34D', fontWeight: 'bold' }}>›</Text>
                </Pressable>
                <View style={{ height: 1, backgroundColor: '#F3F4F6', marginLeft: 48 }} />

                <Pressable
                  onPress={() => {
                    setToast({
                      message: 'Privacy Policy: We encrypt personal details and transaction histories securely.',
                      variant: 'info'
                    });
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 18,
                    backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
                  })}
                >
                  <Feather name="shield" size={20} color="#14532D" style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 17, color: '#111827', fontWeight: '600', flex: 1 }}>Privacy Policy</Text>
                  <Text style={{ fontSize: 20, color: '#FCD34D', fontWeight: 'bold' }}>›</Text>
                </Pressable>
              </View>

              {/* Log Out */}
              <View style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                marginBottom: 40,
                overflow: 'hidden',
                shadowColor: '#14532D',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}>
                <Pressable
                  onPress={handleLogout}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 18,
                    backgroundColor: pressed ? '#FEF2F2' : '#FFFFFF',
                  })}
                >
                  <Feather name="log-out" size={20} color="#DC2626" style={{ marginRight: 12 }} />
                  <Text style={{ fontSize: 17, color: '#DC2626', fontWeight: '700', flex: 1 }}>Log Out</Text>
                  <Text style={{ fontSize: 20, color: '#DC2626', fontWeight: 'bold' }}>›</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Animated.View>
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
