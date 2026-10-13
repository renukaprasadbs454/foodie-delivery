import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '@/components/Text';
import MapView, { Marker, Polygon, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import type { LocationZone } from '../types';

import { DeliveryLocationMap as DeliveryLocationMapWeb } from './DeliveryLocationMap.web';

interface Props {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number, addressText?: string) => void;
  zones?: LocationZone[];
  selectedZoneId?: string | null;
  verifiedZoneName?: string | null;
  isVerified?: boolean;
  hasAttemptedVerification?: boolean;
  verificationStatusText?: string;
  isVerifying?: boolean;
  height?: number;
}

const BRAND_EMERALD = '#14532D';
const BRAND_AMBER = '#F59E0B';
const ERROR_RED = '#DC2626';

function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false;
  const numLat = Number(lat);
  const numLng = Number(lng);
  return (
    !Number.isNaN(numLat) &&
    !Number.isNaN(numLng) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLng >= -180 &&
    numLng <= 180 &&
    !(numLat === 0 && numLng === 0)
  );
}

function parsePolygonCoordinates(polyStr?: string): { latitude: number; longitude: number }[] {
  if (!polyStr) return [];
  try {
    return polyStr
      .split('|')
      .map((part) => {
        const [latStr, lngStr] = part.trim().split(',');
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return { latitude: lat, longitude: lng };
      })
      .filter((p): p is { latitude: number; longitude: number } => p !== null);
  } catch {
    return [];
  }
}

function DeliveryLocationMapNative(props: Props) {
  const {
    latitude,
    longitude,
    onLocationChange,
    zones = [],
    selectedZoneId,
    verifiedZoneName,
    isVerified = false,
    hasAttemptedVerification = false,
    verificationStatusText,
    isVerifying = false,
    height = 260,
  } = props;
  const mapRef = useRef<MapView>(null);

  // Safe fallback to default Tumkur / Bangalore coords (NEVER NaN)
  const safeLat = isValidCoordinate(latitude, longitude) ? Number(latitude) : 13.3379;
  const safeLng = isValidCoordinate(latitude, longitude) ? Number(longitude) : 77.1173;

  const [zoomLevel, setZoomLevel] = useState(15);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleRecenter = () => {
    mapRef.current?.animateToRegion({
      latitude: safeLat,
      longitude: safeLng,
      latitudeDelta: 0.015,
      longitudeDelta: 0.015,
    });
  };

  const handleZoomIn = () => {
    mapRef.current?.animateCamera({ zoom: Math.min(zoomLevel + 1, 20) });
    setZoomLevel((prev) => Math.min(prev + 1, 20));
  };

  const handleZoomOut = () => {
    mapRef.current?.animateCamera({ zoom: Math.max(zoomLevel - 1, 5) });
    setZoomLevel((prev) => Math.max(prev - 1, 5));
  };

  const fetchGpsLocation = async () => {
    setIsFetchingGps(true);
    setGpsError(null);

    try {
      // 1. Check & Request Foreground Location Permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const msg = 'Location permission denied. Please enable location access in device settings.';
        setGpsError(msg);
        Alert.alert('Permission Denied', msg);
        setIsFetchingGps(false);
        return;
      }

      // 2. Fetch actual device GPS coordinates with fallback
      let pos: Location.LocationObject | null = null;
      try {
        pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (_firstErr) {
        // Fallback to last known position if current request times out or GPS disabled
        try {
          pos = await Location.getLastKnownPositionAsync();
        } catch {
          pos = null;
        }
      }

      if (!pos || !pos.coords) {
        throw new Error('Unable to retrieve GPS coordinates. Please ensure GPS/Location is enabled.');
      }

      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));

      // 3. Reverse Geocode address strictly for reference display
      let refAddress = '';
      try {
        const geoResult = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (geoResult && geoResult.length > 0) {
          const addr = geoResult[0];
          refAddress = [
            addr.street,
            addr.name !== addr.street ? addr.name : '',
            addr.city,
            addr.postalCode,
          ]
            .filter(Boolean)
            .join(', ');
        }
      } catch {
        refAddress = `Coordinates: ${lat}°, ${lng}°`;
      }

      // 4. Animate Map to new GPS position
      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });

      // 5. Notify parent with actual GPS coordinates
      onLocationChange(lat, lng, refAddress);
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to detect current GPS location. Please try again.';
      setGpsError(errMsg);
      Alert.alert('Location Error', errMsg);
    } finally {
      setIsFetchingGps(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map View Frame */}
      <View style={[styles.mapFrame, { height }]}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude: safeLat,
            longitude: safeLng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          onPress={(e) => {
            if (e.nativeEvent.coordinate) {
              const { latitude: clickLat, longitude: clickLng } = e.nativeEvent.coordinate;
              onLocationChange(
                Number(clickLat.toFixed(6)),
                Number(clickLng.toFixed(6))
              );
            }
          }}
        >
          {/* Active Admin Delivery Zones Boundaries */}
          {zones.map((zone) => {
            const polygonCoords = parsePolygonCoordinates(zone.polygonCoordinates);
            const hasRadius = zone.latitude && zone.longitude && zone.radiusKm;
            const isSelected = Boolean(selectedZoneId && zone.id === selectedZoneId);

            return (
              <React.Fragment key={zone.id}>
                {polygonCoords.length >= 3 && (
                  <Polygon
                    coordinates={polygonCoords}
                    strokeColor={isSelected ? 'rgba(20, 83, 45, 0.95)' : 'rgba(20, 83, 45, 0.6)'}
                    fillColor={isSelected ? 'rgba(20, 83, 45, 0.25)' : 'rgba(20, 83, 45, 0.12)'}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                )}
                {hasRadius && (
                  <Circle
                    center={{ latitude: zone.latitude, longitude: zone.longitude }}
                    radius={zone.radiusKm * 1000}
                    strokeColor={isSelected ? 'rgba(20, 83, 45, 0.95)' : 'rgba(245, 158, 11, 0.6)'}
                    fillColor={isSelected ? 'rgba(20, 83, 45, 0.22)' : 'rgba(245, 158, 11, 0.08)'}
                    strokeWidth={isSelected ? 3 : 1.5}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Delivery Partner GPS Pin */}
          <Marker
            coordinate={{ latitude: safeLat, longitude: safeLng }}
            draggable
            onDragEnd={(e) => {
              if (e.nativeEvent.coordinate) {
                const { latitude: dragLat, longitude: dragLng } = e.nativeEvent.coordinate;
                onLocationChange(
                  Number(dragLat.toFixed(6)),
                  Number(dragLng.toFixed(6))
                );
              }
            }}
            pinColor={isVerified ? BRAND_EMERALD : BRAND_AMBER}
            title="Your Current Location"
            description={verifiedZoneName ? `Zone: ${verifiedZoneName}` : 'Move pin or fetch GPS location'}
          />
        </MapView>

        {/* Top-Left Coordinates Overlay */}
        <View style={styles.coordOverlay} pointerEvents="none">
          <Text variant="caption" style={{ color: BRAND_AMBER, fontWeight: '700' }}>
            ● Google Maps
          </Text>
          <Text variant="caption" style={{ color: '#F8FAFC', fontWeight: '600' }}>
            {safeLat.toFixed(4)}°, {safeLng.toFixed(4)}°
          </Text>
        </View>

        {/* Top-Right Zone Verification Badge */}
        <View style={styles.badgeOverlay} pointerEvents="none">
          {isVerified ? (
            <View style={[styles.badgePill, styles.badgeSuccess]}>
              <Text variant="caption" style={styles.badgeTextSuccess}>
                ✓ {verifiedZoneName || 'Zone Verified'}
              </Text>
            </View>
          ) : isVerifying || isFetchingGps ? (
            <View style={[styles.badgePill, styles.badgeLoading]}>
              <Text variant="caption" style={styles.badgeTextLoading}>
                ⏳ Verifying...
              </Text>
            </View>
          ) : hasAttemptedVerification ? (
            <View style={[styles.badgePill, styles.badgeWarning]}>
              <Text variant="caption" style={styles.badgeTextWarning}>
                {verificationStatusText || '⚠️ Outside Zone'}
              </Text>
            </View>
          ) : (
            <View style={[styles.badgePill, styles.badgeNeutral]}>
              <Text variant="caption" style={styles.badgeTextNeutral}>
                📍 GPS Active
              </Text>
            </View>
          )}
        </View>

        {/* Loading Overlay when Fetching GPS or Verifying */}
        {(isFetchingGps || isVerifying) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={BRAND_AMBER} />
            <Text variant="body" style={styles.loadingText}>
              {isFetchingGps ? 'Detecting device GPS location...' : 'Verifying delivery zone on server...'}
            </Text>
          </View>
        )}

        {/* Map Control Buttons */}
        <View style={styles.controlsContainer} pointerEvents="box-none">
          <Pressable
            onPress={handleRecenter}
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
            accessibilityLabel="Recenter map"
          >
            <Text style={{ fontSize: 16 }}>🎯</Text>
          </Pressable>
          <Pressable
            onPress={handleZoomIn}
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
            accessibilityLabel="Zoom in"
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>+</Text>
          </Pressable>
          <Pressable
            onPress={handleZoomOut}
            style={({ pressed }) => [styles.controlButton, pressed && styles.controlButtonPressed]}
            accessibilityLabel="Zoom out"
          >
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0F172A' }}>−</Text>
          </Pressable>
        </View>
      </View>

      {/* Fetch GPS Location Action Button */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={fetchGpsLocation}
          disabled={isFetchingGps || isVerifying}
          style={({ pressed }) => [
            styles.fetchGpsButton,
            pressed && styles.fetchGpsButtonPressed,
            (isFetchingGps || isVerifying) && styles.fetchGpsButtonDisabled,
          ]}
          accessibilityLabel="Fetch GPS Location"
        >
          {isFetchingGps ? (
            <ActivityIndicator size="small" color="#92400E" />
          ) : (
            <Text style={{ fontSize: 16 }}>📍</Text>
          )}
          <Text style={styles.fetchGpsButtonText}>
            {isFetchingGps ? 'Fetching GPS Coordinates...' : 'Fetch GPS Location'}
          </Text>
        </Pressable>
      </View>

      {/* GPS Error Alert if any */}
      {gpsError && (
        <View style={styles.gpsErrorBanner}>
          <Text variant="caption" style={{ color: ERROR_RED, fontWeight: '600' }}>
            ⚠️ {gpsError}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
  },
  mapFrame: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  coordOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 20,
  },
  badgeOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 20,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
    borderColor: '#10B981',
  },
  badgeWarning: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  badgeLoading: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  badgeNeutral: {
    backgroundColor: '#F1F5F9',
    borderColor: '#94A3B8',
  },
  badgeTextSuccess: {
    color: '#047857',
    fontWeight: '800',
    fontSize: 11,
  },
  badgeTextWarning: {
    color: '#B91C1C',
    fontWeight: '800',
    fontSize: 11,
  },
  badgeTextLoading: {
    color: '#1D4ED8',
    fontWeight: '800',
    fontSize: 11,
  },
  badgeTextNeutral: {
    color: '#475569',
    fontWeight: '800',
    fontSize: 11,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    padding: 16,
  },
  loadingText: {
    color: '#FEF3C7',
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    gap: 8,
    zIndex: 20,
  },
  controlButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonPressed: {
    backgroundColor: '#FEF3C7',
  },
  actionRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fetchGpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#F59E0B',
  },
  fetchGpsButtonPressed: {
    backgroundColor: '#FDE68A',
  },
  fetchGpsButtonDisabled: {
    opacity: 0.6,
  },
  fetchGpsButtonText: {
    color: '#92400E',
    fontWeight: '800',
    fontSize: 13,
  },
  gpsErrorBanner: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
});

export function DeliveryLocationMap(props: Props) {
  if ((Platform.OS as string) === 'web') {
    return <DeliveryLocationMapWeb {...props} />;
  }
  return <DeliveryLocationMapNative {...props} />;
}

