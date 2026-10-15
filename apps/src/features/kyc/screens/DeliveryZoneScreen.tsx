import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useTheme } from '@/hooks/useTheme';
import { Toast } from '@/components/Toast';
import { clearRefreshToken } from '@/auth/secureStorage';
import {
  useGetDeliveryProfileQuery,
  useGetDeliveryZonesQuery,
  useVerifyDeliveryZoneMutation,
} from '@/api/endpoints/deliveryApi';
import { baseApi } from '@/api/baseApi';
import { useAppDispatch } from '@/store/hooks';
import { DeliveryLocationMap } from '../components/DeliveryLocationMap';
import type { KycStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<KycStackParamList, 'DeliveryZone'>;

const THEME_EMERALD = '#14532D';

export function DeliveryZoneScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const dispatch = useAppDispatch();
  const { isConnected } = useConnectivity();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const profileQuery = useGetDeliveryProfileQuery(undefined, { refetchOnFocus: true });
  const { data: activeZones = [], isLoading: isLoadingZones } = useGetDeliveryZonesQuery();
  const [verifyDeliveryZone, { isLoading: isVerifyingZone }] = useVerifyDeliveryZoneMutation();

  // Zone & GPS Location State
  const [currentLat, setCurrentLat] = useState<number>(13.3379);
  const [currentLng, setCurrentLng] = useState<number>(77.1173);
  const [referenceAddress, setReferenceAddress] = useState<string>('');
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isZoneVerified, setIsZoneVerified] = useState<boolean>(false);
  const [verifiedZoneName, setVerifiedZoneName] = useState<string | null>(null);
  const [zoneStatusMessage, setZoneStatusMessage] = useState<string>('');
  const [hasAttemptedVerification, setHasAttemptedVerification] = useState<boolean>(false);

  // Automatic GPS Fetch State
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsDetected, setGpsDetected] = useState<boolean>(false);

  const isInitialGpsRequested = useRef(false);

  // Sync profile data if previously verified
  useEffect(() => {
    if (profileQuery.data) {
      if (profileQuery.data.zoneVerified) {
        setIsZoneVerified(true);
        setHasAttemptedVerification(true);
        if (profileQuery.data.zoneName) {
          setVerifiedZoneName(profileQuery.data.zoneName);
          setZoneStatusMessage(`Location Verified — ${profileQuery.data.zoneName}`);
        }
        if (profileQuery.data.zoneId) {
          setSelectedZoneId((prev) => prev || profileQuery.data?.zoneId || null);
        }
        if (profileQuery.data.latitude && profileQuery.data.longitude) {
          setCurrentLat(profileQuery.data.latitude);
          setCurrentLng(profileQuery.data.longitude);
        }
        if (profileQuery.data.addressLine1) {
          setReferenceAddress(profileQuery.data.addressLine1);
        }
      }
    }
  }, [profileQuery.data]);

  // Pre-select zone if available or when zones load
  useEffect(() => {
    if (activeZones.length > 0 && !selectedZoneId) {
      if (profileQuery.data?.zoneId) {
        const matchingZone = activeZones.find((z) => z.id === profileQuery.data?.zoneId);
        if (matchingZone) {
          setSelectedZoneId(matchingZone.id);
          return;
        }
      }
      // Auto-select if only 1 active zone configured by admin
      if (activeZones.length === 1) {
        setSelectedZoneId(activeZones[0].id);
      }
    }
  }, [activeZones, selectedZoneId, profileQuery.data?.zoneId]);

  // Backend verification function
  const executeVerification = useCallback(
    async (lat: number, lng: number, zoneId: string | null, addressText?: string) => {
      if (!zoneId) {
        setIsZoneVerified(false);
        setVerifiedZoneName(null);
        setZoneStatusMessage('');
        return;
      }

      if (!isConnected) {
        setToast({
          message: 'Connect to internet to verify delivery zone.',
          variant: 'warning',
        });
        return;
      }

      try {
        const res = await verifyDeliveryZone({
          latitude: lat,
          longitude: lng,
          zoneId,
          address: addressText || referenceAddress,
        }).unwrap();

        setHasAttemptedVerification(true);
        if (res.verified) {
          setIsZoneVerified(true);
          const name = res.zoneName || activeZones.find((z) => z.id === zoneId)?.zoneName || 'Active Zone';
          setVerifiedZoneName(name);
          const successMsg = res.message || `Location Verified — ${name}`;
          setZoneStatusMessage(successMsg);
          setToast({ message: successMsg, variant: 'success' });
        } else {
          setIsZoneVerified(false);
          setVerifiedZoneName(null);
          const outsideMsg =
            res.message ||
            'You are outside the selected delivery zone. Please move into the zone and try again.';
          setZoneStatusMessage(outsideMsg);
          setToast({ message: outsideMsg, variant: 'error' });
        }
      } catch (e: any) {
        setHasAttemptedVerification(true);
        setIsZoneVerified(false);
        setVerifiedZoneName(null);
        const errMsg =
          e?.data?.message ||
          'You are outside the selected delivery zone. Please move into the zone and try again.';
        setZoneStatusMessage(errMsg);
        setToast({ message: errMsg, variant: 'error' });
      }
    },
    [isConnected, referenceAddress, verifyDeliveryZone, activeZones]
  );

  // 1. Automatically fetch GPS immediately on mount
  const fetchGpsCoordinates = useCallback(async () => {
    setIsGpsLoading(true);
    setGpsError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsGpsLoading(false);
        setGpsError('Location permission denied. Please enable location access in device settings.');
        return;
      }

      let pos: Location.LocationObject | null = null;
      try {
        pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch {
        try {
          pos = await Location.getLastKnownPositionAsync();
        } catch {
          pos = null;
        }
      }

      if (!pos || !pos.coords) {
        setIsGpsLoading(false);
        setGpsError('GPS location unavailable. Please ensure location services are turned on.');
        return;
      }

      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      setCurrentLat(lat);
      setCurrentLng(lng);
      setGpsDetected(true);
      setIsGpsLoading(false);

      // Reverse geocode strictly for reference address display
      let refAddr = '';
      try {
        const geoResult = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geoResult && geoResult.length > 0) {
          const addr = geoResult[0];
          refAddr = [
            addr.street,
            addr.name !== addr.street ? addr.name : '',
            addr.city,
            addr.postalCode,
          ]
            .filter(Boolean)
            .join(', ');
          if (refAddr) {
            setReferenceAddress(refAddr);
          }
        }
      } catch {
        // Geocode error ignored
      }

      // If zone is already selected, verify immediately with actual GPS coordinates
      if (selectedZoneId) {
        await executeVerification(lat, lng, selectedZoneId, refAddr);
      }
    } catch (err: any) {
      setIsGpsLoading(false);
      const errMsg = err?.message || 'Failed to detect current GPS location. Please try again.';
      setGpsError(errMsg);
    }
  }, [selectedZoneId, executeVerification]);

  useEffect(() => {
    if (!isInitialGpsRequested.current) {
      isInitialGpsRequested.current = true;
      void fetchGpsCoordinates();
    }
  }, [fetchGpsCoordinates]);

  // Handler for zone selection by partner
  const handleZoneSelect = async (zoneId: string) => {
    setSelectedZoneId(zoneId);
    // Invalidate stale verification when partner switches zone
    setIsZoneVerified(false);
    setVerifiedZoneName(null);

    // Verify coordinates against new zone immediately
    await executeVerification(currentLat, currentLng, zoneId, referenceAddress);
  };

  // Handler for GPS location changes from map interaction / recenter
  const handleLocationChange = async (lat: number, lng: number, addressText?: string) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    if (addressText) {
      setReferenceAddress(addressText);
    }

    if (selectedZoneId) {
      await executeVerification(lat, lng, selectedZoneId, addressText);
    }
  };

  const handleContinueToDocuments = async () => {
    if (!isZoneVerified) {
      setToast({
        message: 'You are outside the selected delivery zone. Please move into the zone and try again.',
        variant: 'error',
      });
      return;
    }

    // Authoritative backend check before navigation
    try {
      const refetched = await profileQuery.refetch().unwrap();
      if (!refetched?.zoneVerified) {
        setIsZoneVerified(false);
        setToast({
          message: 'You are outside the selected delivery zone. Please move into the zone and try again.',
          variant: 'error',
        });
        return;
      }
      navigation.navigate('KycForm');
    } catch {
      if (isZoneVerified) {
        navigation.navigate('KycForm');
      } else {
        setToast({
          message: 'Delivery zone verification required. Please verify your location first.',
          variant: 'error',
        });
      }
    }
  };

  const selectedZone = activeZones.find((z) => z.id === selectedZoneId);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <View style={styles.topGradientBar}>
        <View style={styles.topNavRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : null)}
          >
            <Feather name="arrow-left" size={24} color="white" />
          </Pressable>
          <Text variant="heading2" style={{ color: 'white', flex: 1, marginLeft: 16 }}>
            Onboarding
          </Text>
          <Pressable
            style={styles.helpPill}
            onPress={async () => {
              await clearRefreshToken();
              dispatch({ type: 'auth/clearCredentials' });
              setTimeout(() => {
                dispatch(baseApi.util.resetApiState());
              }, 500);
            }}
          >
            <Feather name="log-out" size={16} color="black" />
            <Text variant="caption" style={{ marginLeft: 4, fontWeight: 'bold' }}>
              LOGOUT
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <MaterialIcons name="my-location" size={48} color={THEME_EMERALD} />
          <Text variant="heading1" style={{ marginTop: 12 }}>
            Location & Delivery Zone
          </Text>
          <Text variant="body" color={tokens.color.textSecondary}>
            Your current GPS coordinates must be within an active admin-configured delivery zone before uploading documents.
          </Text>
        </View>

        {/* Location & Delivery Zone Card */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="my-location" size={24} color={THEME_EMERALD} />
            <Text variant="heading2" style={{ marginLeft: 8 }}>
              Delivery Zone Verification
            </Text>
          </View>
          <Text
            variant="caption"
            color={tokens.color.textSecondary}
            style={{ marginBottom: 14 }}
          >
            Your device GPS coordinates are automatically detected and verified against your selected delivery zone.
          </Text>

          {/* Admin-Configured Delivery Zone Selection */}
          <View style={styles.zoneSelectionSection}>
            <View style={styles.zoneHeadingRow}>
              <Feather name="layers" size={20} color={THEME_EMERALD} />
              <Text variant="heading2" style={{ marginLeft: 8, fontSize: 16 }}>
                Select Your Zone
              </Text>
            </View>
            <Text variant="caption" color={tokens.color.textSecondary} style={{ marginBottom: 12 }}>
              Choose the delivery zone you will be operating in. Your location will be verified against this zone.
            </Text>

            {isLoadingZones ? (
              <View style={styles.zoneLoadingBox}>
                <ActivityIndicator size="small" color={THEME_EMERALD} />
                <Text variant="caption" style={{ marginLeft: 8, color: '#64748B' }}>
                  Loading admin-configured delivery zones...
                </Text>
              </View>
            ) : activeZones.length === 0 ? (
              <View style={styles.noZonesBox}>
                <Feather name="info" size={18} color="#64748B" />
                <Text variant="caption" style={{ marginLeft: 6, color: '#64748B' }}>
                  No active delivery zones configured. Please contact support.
                </Text>
              </View>
            ) : (
              <View style={styles.zonesList}>
                {activeZones.map((zone) => {
                  const isSelected = selectedZoneId === zone.id;
                  const isThisZoneVerified = isZoneVerified && verifiedZoneName === zone.zoneName;

                  return (
                    <Pressable
                      key={zone.id}
                      onPress={() => handleZoneSelect(zone.id)}
                      disabled={isVerifyingZone || isGpsLoading}
                      style={[
                        styles.zoneCard,
                        isSelected && styles.zoneCardSelected,
                        (isVerifyingZone || isGpsLoading) && { opacity: 0.8 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select zone ${zone.zoneName}`}
                    >
                      <View style={styles.zoneCardContent}>
                        <View style={styles.zoneRadioCircle}>
                          {isSelected && <View style={styles.zoneRadioInner} />}
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                            <Text
                              variant="body"
                              style={{
                                fontWeight: isSelected ? '700' : '600',
                                color: isSelected ? '#0F172A' : '#334155',
                                fontSize: 15,
                              }}
                            >
                              {zone.zoneName}
                            </Text>
                            {isThisZoneVerified ? (
                              <View style={styles.verifiedMiniPill}>
                                <Text style={styles.verifiedMiniPillText}>✓ Verified</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text variant="caption" style={{ color: '#64748B', marginTop: 2 }}>
                            {zone.radiusKm
                              ? `Coverage: ${zone.radiusKm} km radius`
                              : zone.polygonCoordinates
                              ? 'Coverage: Polygon boundary'
                              : 'Active administrative delivery zone'}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Delivery Location Map */}
          <DeliveryLocationMap
            latitude={currentLat}
            longitude={currentLng}
            onLocationChange={handleLocationChange}
            zones={activeZones}
            selectedZoneId={selectedZoneId}
            verifiedZoneName={verifiedZoneName}
            isVerified={isZoneVerified}
            hasAttemptedVerification={hasAttemptedVerification}
            isVerifying={isVerifyingZone || isGpsLoading}
            verificationStatusText={zoneStatusMessage}
          />

          {/* Reference Address Box */}
          {referenceAddress ? (
            <View style={styles.refAddressBox}>
              <Text variant="caption" style={{ color: '#64748B', fontWeight: '700' }}>
                📍 Detected Address (for reference):
              </Text>
              <Text variant="body" style={{ color: '#1E293B', marginTop: 3, fontSize: 13 }}>
                {referenceAddress}
              </Text>
            </View>
          ) : null}

          {/* Verification Status Banner - Hides Premature Warnings */}
          {isGpsLoading ? (
            <View style={[styles.zoneStatusBanner, styles.zoneStatusLoading]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator size="small" color="#2563EB" />
                <View style={{ flex: 1 }}>
                  <Text variant="heading3" style={{ color: '#1E40AF', fontSize: 14 }}>
                    Detecting Device GPS Location...
                  </Text>
                  <Text variant="caption" style={{ color: '#3B82F6', marginTop: 2 }}>
                    Automatically requesting current GPS coordinates. Please allow location access if prompted.
                  </Text>
                </View>
              </View>
            </View>
          ) : gpsError && !gpsDetected ? (
            <View style={[styles.zoneStatusBanner, styles.zoneStatusNotice]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Feather name="alert-circle" size={22} color="#D97706" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text variant="heading3" style={{ color: '#92400E', fontSize: 14 }}>
                    GPS Detection Required
                  </Text>
                  <Text variant="caption" style={{ color: '#B45309', marginTop: 2 }}>
                    {gpsError}
                  </Text>
                  <Pressable
                    style={styles.retryGpsButton}
                    onPress={fetchGpsCoordinates}
                  >
                    <Feather name="refresh-cw" size={14} color="#92400E" />
                    <Text variant="caption" style={{ color: '#92400E', fontWeight: '700', marginLeft: 4 }}>
                      Retry GPS Location
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ) : isVerifyingZone ? (
            <View style={[styles.zoneStatusBanner, styles.zoneStatusLoading]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator size="small" color="#14532D" />
                <View style={{ flex: 1 }}>
                  <Text variant="heading3" style={{ color: '#14532D', fontSize: 14 }}>
                    Verifying Delivery Zone...
                  </Text>
                  <Text variant="caption" style={{ color: '#047857', marginTop: 2 }}>
                    Confirming GPS coordinates with server for {selectedZone?.zoneName || 'selected zone'}...
                  </Text>
                </View>
              </View>
            </View>
          ) : !selectedZoneId && !hasAttemptedVerification ? (
            <View style={[styles.zoneStatusBanner, styles.zoneStatusNeutral]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Feather name="map-pin" size={20} color="#475569" />
                <View style={{ flex: 1 }}>
                  <Text variant="heading3" style={{ color: '#334155', fontSize: 14 }}>
                    GPS Coordinates Detected
                  </Text>
                  <Text variant="caption" style={{ color: '#64748B', marginTop: 2 }}>
                    Please select your delivery zone to verify your location.
                  </Text>
                </View>
              </View>
            </View>
          ) : hasAttemptedVerification && isZoneVerified ? (
            <View style={[styles.zoneStatusBanner, styles.zoneStatusSuccess]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Feather name="check-circle" size={22} color={THEME_EMERALD} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text
                    variant="heading3"
                    style={{
                      color: THEME_EMERALD,
                      fontSize: 15,
                      marginBottom: 3,
                    }}
                  >
                    {zoneStatusMessage || `Location Verified — ${verifiedZoneName || selectedZone?.zoneName || 'Active Zone'}`}
                  </Text>
                  <Text variant="caption" style={{ color: '#047857' }}>
                    Your current GPS coordinates have been successfully verified against active delivery zone boundaries.
                  </Text>
                </View>
              </View>
            </View>
          ) : hasAttemptedVerification && !isZoneVerified ? (
            <View style={[styles.zoneStatusBanner, styles.zoneStatusWarning]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <Feather name="alert-triangle" size={22} color="#DC2626" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text
                    variant="heading3"
                    style={{
                      color: '#DC2626',
                      fontSize: 15,
                      marginBottom: 3,
                    }}
                  >
                    {zoneStatusMessage || 'You are outside the selected delivery zone. Please move into the zone and try again.'}
                  </Text>
                  <Text variant="caption" style={{ color: '#991B1B' }}>
                    Your GPS coordinates do not fall inside the configured boundary of {selectedZone?.zoneName || 'the selected zone'}.
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Continue to Documents Action Button */}
          <View style={{ marginTop: 20 }}>
            <Button
              label={isZoneVerified ? 'Continue to Documents →' : 'Continue to Documents (Locked)'}
              variant="primary"
              disabled={!isZoneVerified || isVerifyingZone || isGpsLoading}
              onPress={handleContinueToDocuments}
              accessibilityLabel="Continue to Documents"
            />
          </View>
        </View>
      </ScrollView>

      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        onDismiss={() => setToast(null)}
        accessibilityLabel={toast?.message ?? 'Toast message'}
      />
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
    paddingBottom: 60,
  },
  headerContainer: {
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  sectionCard: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  refAddressBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  zoneStatusBanner: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  zoneStatusLoading: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
  },
  zoneStatusNotice: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
  },
  zoneStatusNeutral: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  zoneStatusSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  zoneStatusWarning: {
    backgroundColor: '#FEE2E2',
    borderColor: '#F87171',
  },
  retryGpsButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  zoneSelectionSection: {
    marginBottom: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  zoneHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  zoneLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  noZonesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  zonesList: {
    gap: 10,
  },
  zoneCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  zoneCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  zoneCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  zoneRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  cityPill: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cityPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },
  verifiedMiniPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  verifiedMiniPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
});
