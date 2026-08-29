import React, { useEffect, useState } from 'react';
import { ScrollView, View, ActivityIndicator, Pressable, StyleSheet, Image } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { ENV } from '../../../constants/env';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Text,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetDeliveryProfileQuery, useUploadDeliveryProfileImageMutation } from '../../../api/endpoints/deliveryApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import {
  selectUserId,
  selectUserType,
  clearCredentials,
} from '../../auth/authSlice';
import { clearRefreshToken } from 'foodie-shared-rn';
import { baseApi } from '../../../api/baseApi';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import type { MainStackParamList } from '../../../navigation/types';
import { BottomNav } from '../../../navigation/BottomNav';

type Props = NativeStackScreenProps<MainStackParamList, 'DeliveryProfile'>;

export function DeliveryProfileScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const insets = useSafeAreaInsets();
  const { isConnected } = useConnectivity();
  const userId = useAppSelector(selectUserId);
  const userType = useAppSelector(selectUserType);
  const profileQuery = useGetDeliveryProfileQuery();
  const dispatch = useAppDispatch();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) => setToast({ message: error.message, variant: 'error' }),
    onInlineField: (error) => setToast({ message: error.message, variant: 'error' }),
    onFullScreen: (error) => setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) => setToast({ message: error.message, variant: 'error' }),
  });

  useEffect(() => {
    trackAnalyticsEvent('delivery_profile_viewed');
  }, []);


  const initials = userId ? userId.slice(0, 2).toUpperCase() : 'DP';

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

  const nameVal = profileQuery.data?.fullName && profileQuery.data.fullName !== 'Delivery Partner' ? profileQuery.data.fullName : 'Delivery Partner';
  const roleVal = userType ?? 'DELIVERY_PARTNER';
  const kycStatus = profileQuery.data?.kycStatus ?? 'PENDING';

  const handleLogout = () => {
    void clearRefreshToken().then(() => {
      dispatch(clearCredentials());
      setTimeout(() => {
        dispatch(baseApi.util.resetApiState());
      }, 500);
      trackAnalyticsEvent('delivery_logout');
      setToast({ message: 'Logged out successfully.', variant: 'success' });
    });
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

      <ScrollView
        contentContainerStyle={{ paddingBottom: 80, paddingTop: insets.top + 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
          <Pressable onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
            <Feather name="arrow-left" size={22} color="#FFF" />
          </Pressable>
          <Text style={{ fontSize: 34, fontWeight: '900', color: '#FCD34D', letterSpacing: 0.5 }}>Profile</Text>
        </View>

        {/* iOS Profile Avatar header inside the dark green arch */}
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <View
            style={{
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
            }}
          >
            {finalImgUri ? (
              <Image
                source={{ uri: finalImgUri }}
                style={{ width: 94, height: 94, borderRadius: 47 }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ width: 94, height: 94, borderRadius: 47, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 32, fontWeight: '800', color: '#64748B' }}>{initials}</Text>
              </View>
            )}
          </View>

          <Text style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }}>
            {nameVal}
          </Text>
          <Text style={{ fontSize: 15, color: '#A7F3D0', fontWeight: '600' }}>
            {roleVal.replace('_', ' ')}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600', marginLeft: 16, marginBottom: 8, letterSpacing: 0.5 }}>
            ACCOUNT DETAILS
          </Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 16, color: '#111827' }}>Full Name</Text>
              <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: '500' }}>{nameVal}</Text>
            </View>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginLeft: 16 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 16, color: '#111827' }}>User ID</Text>
              <Text style={{ fontSize: 16, color: '#6B7280', fontWeight: '500' }}>
                #{userId ? userId.substring(0, 8).toUpperCase() : '...'}
              </Text>
            </View>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginLeft: 16 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 16, color: '#111827' }}>Verification</Text>
              <Text style={{ fontSize: 16, color: kycStatus === 'VERIFIED' ? '#10B981' : '#F59E0B', fontWeight: '700' }}>
                {kycStatus === 'VERIFIED' ? 'Verified' : 'Pending KYC'}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 13, color: '#6B7280', fontWeight: '600', marginLeft: 16, marginBottom: 8, letterSpacing: 0.5 }}>
            PREFERENCES & SETTINGS
          </Text>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
            <Pressable
              onPress={() => navigation.navigate('DeliverySettings')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 16,
                backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="settings" size={20} color="#14532D" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: '#111827' }}>App Settings</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#D1D5DB" />
            </Pressable>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginLeft: 16 }} />

            <Pressable
              onPress={() => navigation.navigate('Wallet')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 16,
                backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="credit-card" size={20} color="#14532D" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: '#111827' }}>Wallet & Payouts</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#D1D5DB" />
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('DeliveryBankDetails')}
              style={({ pressed }) => ({
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 16,
                backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="briefcase" size={20} color="#14532D" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: '#111827' }}>Bank Details</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#D1D5DB" />
            </Pressable>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginLeft: 16 }} />

            {/* COD Cash Deposit */}
            <Pressable
              onPress={() => navigation.navigate('CashDeposit' as any)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 16,
                backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="package" size={20} color="#D97706" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: '#111827' }}>COD Cash Deposit</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#D1D5DB" />
            </Pressable>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginLeft: 16 }} />

            {/* Legal Documents */}
            <Pressable
              onPress={() => setToast({ message: 'Terms & Conditions clicked.', variant: 'info' })}
              style={({ pressed }) => ({
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 16,
                backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="file-text" size={20} color="#14532D" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: '#111827' }}>Terms & Conditions</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#D1D5DB" />
            </Pressable>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: '#E5E7EB', marginLeft: 16 }} />

            <Pressable
              onPress={() => setToast({ message: 'Privacy Policy clicked.', variant: 'info' })}
              style={({ pressed }) => ({
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 16,
                backgroundColor: pressed ? '#F9FAFB' : '#FFFFFF',
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="shield" size={20} color="#14532D" style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: '#111827' }}>Privacy Policy</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#D1D5DB" />
            </Pressable>
          </View>

          {/* Premium Logout Button */}
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => ({
              backgroundColor: '#fee2e2',
              borderColor: '#fca5a5',
              borderWidth: 1,
              borderRadius: 16,
              height: 52,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 32,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Text style={{ color: '#dc2626', fontSize: 16, fontWeight: '700' }}>Logout</Text>
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
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7', // Standard iOS background
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 60,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
    marginBottom: 24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrap: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FCD34D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  headerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  headerRole: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4,
  },
  changePhotoBtn: {
    marginTop: 16,
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changePhotoText: {
    color: '#14532D',
    fontWeight: '700',
    fontSize: 14,
  },
  groupLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  groupedList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  listItemNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  listLabel: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '400',
  },
  listValue: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 16,
  },
});
