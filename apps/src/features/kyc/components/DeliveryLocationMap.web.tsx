import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '@/components/Text';
import * as Location from 'expo-location';
import type { LocationZone } from '../types';

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

// Global promise to load Leaflet scripts once
let leafletPromise: Promise<any> | null = null;

function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if ((window as any).L) return Promise.resolve((window as any).L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    try {
      // 1. Inject Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.onerror = () => {
          // Fallback CDN for CSS
          const fallbackLink = document.createElement('link');
          fallbackLink.rel = 'stylesheet';
          fallbackLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
          document.head.appendChild(fallbackLink);
        };
        document.head.appendChild(link);
      }

      // 2. Inject Leaflet custom styling
      if (!document.getElementById('foodie-leaflet-custom-css')) {
        const style = document.createElement('style');
        style.id = 'foodie-leaflet-custom-css';
        style.innerHTML = `
          .foodie-map-container,
          .leaflet-container {
            width: 100% !important;
            height: 100% !important;
            background-color: #E2E8F0 !important;
            font-family: inherit !important;
            z-index: 1;
          }
          .foodie-marker-wrapper {
            background: transparent !important;
            border: none !important;
          }
          .foodie-marker-node {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transform: translate(-50%, -100%);
            cursor: grab;
            user-select: none;
          }
          .foodie-zone-tooltip {
            background-color: rgba(15, 23, 42, 0.92) !important;
            color: #F8FAFC !important;
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
            border-radius: 6px !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            padding: 4px 8px !important;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3) !important;
          }
          .foodie-zone-tooltip::before {
            border-top-color: rgba(15, 23, 42, 0.92) !important;
          }
        `;
        document.head.appendChild(style);
      }

      // 3. Inject Leaflet JS
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        console.info('[DeliveryLocationMap] Leaflet JS loaded successfully');
        resolve((window as any).L);
      };
      script.onerror = () => {
        console.warn('[DeliveryLocationMap] Primary Leaflet CDN failed, trying cdnjs fallback');
        // Try cdnjs fallback
        const fallbackScript = document.createElement('script');
        fallbackScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
        fallbackScript.onload = () => {
          console.info('[DeliveryLocationMap] Leaflet JS loaded from cdnjs fallback');
          resolve((window as any).L);
        };
        fallbackScript.onerror = (err) => {
          leafletPromise = null;
          console.error('[DeliveryLocationMap] Failed to load Leaflet JS from all CDNs', err);
          reject(new Error('Unable to load map engine (Leaflet). Please check your internet connection.'));
        };
        document.head.appendChild(fallbackScript);
      };
      document.head.appendChild(script);
    } catch (e) {
      leafletPromise = null;
      reject(e);
    }
  });

  return leafletPromise;
}

export function DeliveryLocationMap({
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
}: Props) {
  const mapDomRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const zonesLayerGroupRef = useRef<any>(null);

  // Safe fallback coordinates (Tumkur Central: 13.3379, 77.1173)
  const safeLat = isValidCoordinate(latitude, longitude) ? Number(latitude) : 13.3379;
  const safeLng = isValidCoordinate(latitude, longitude) ? Number(longitude) : 77.1173;

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Helper to build custom HTML pin icon
  const createMarkerIcon = useCallback((L: any, verified: boolean, zoneName?: string | null) => {
    const pinBg = verified ? BRAND_EMERALD : BRAND_AMBER;
    const badgeText = zoneName ? `✓ ${zoneName}` : 'Your Location';

    const iconHtml = document.createElement('div');
    iconHtml.className = 'foodie-marker-node';
    iconHtml.innerHTML = `
      <div style="width: 36px; height: 36px; border-radius: 50%; background-color: ${pinBg}; border: 3px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 18px;">
        📍
      </div>
      <div style="background-color: rgba(15, 23, 42, 0.95); color: #F8FAFC; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-top: 4px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.25);">
        ${badgeText}
      </div>
    `;

    return L.divIcon({
      html: iconHtml,
      className: 'foodie-marker-wrapper',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
  }, []);

  // Update Zone Boundaries Overlays on the map
  const renderZonesOverlays = useCallback((map: any, L: any) => {
    if (!map || !L) return;

    if (!zonesLayerGroupRef.current) {
      zonesLayerGroupRef.current = L.layerGroup().addTo(map);
    } else {
      zonesLayerGroupRef.current.clearLayers();
    }

    const group = zonesLayerGroupRef.current;

    zones.forEach((zone) => {
      const isSelected = Boolean(selectedZoneId && zone.id === selectedZoneId);

      // 1. Polygon Boundaries
      const polygonCoords = parsePolygonCoordinates(zone.polygonCoordinates);
      if (polygonCoords.length >= 3) {
        const latlngs = polygonCoords.map((p) => [p.latitude, p.longitude]);
        const poly = L.polygon(latlngs, {
          color: BRAND_EMERALD,
          weight: isSelected ? 4 : 2,
          fillColor: BRAND_EMERALD,
          fillOpacity: isSelected ? 0.30 : 0.12,
          dashArray: isSelected ? undefined : '5, 5',
        }).addTo(group);

        poly.bindTooltip(
          `<b>🏷️ ${zone.zoneName}</b><br><span style="font-size:10px;color:#94a3b8">${isSelected ? 'Selected Delivery Zone' : 'Active Delivery Zone'}</span>`,
          { className: 'foodie-zone-tooltip', sticky: true }
        );
      }

      // 2. Radius Circle Boundaries
      if (zone.latitude && zone.longitude && zone.radiusKm) {
        const circle = L.circle([zone.latitude, zone.longitude], {
          radius: zone.radiusKm * 1000,
          color: isSelected ? BRAND_EMERALD : BRAND_AMBER,
          weight: isSelected ? 3.5 : 2,
          fillColor: isSelected ? BRAND_EMERALD : BRAND_AMBER,
          fillOpacity: isSelected ? 0.25 : 0.10,
        }).addTo(group);

        circle.bindTooltip(
          `<b>🏷️ ${zone.zoneName}</b><br><span style="font-size:10px;color:#94a3b8">${zone.radiusKm} km Delivery Zone${isSelected ? ' (Selected)' : ''}</span>`,
          { className: 'foodie-zone-tooltip', sticky: true }
        );
      }
    });
  }, [zones, selectedZoneId]);

  // Initialize Map
  const initMap = useCallback(() => {
    if (!mapDomRef.current) return;
    setMapError(null);

    loadLeaflet()
      .then((L) => {
        if (!mapDomRef.current) return;

        // Clean up any existing instance
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        console.info(`[DeliveryLocationMap] Initializing Leaflet map at lat=${safeLat}, lng=${safeLng}`);

        const map = L.map(mapDomRef.current, {
          center: [safeLat, safeLng],
          zoom: 14,
          zoomControl: false, // Using our custom zoom buttons
          attributionControl: false,
        });

        // Add Google Streets tile layer
        let osmFallbackAdded = false;
        const googleStreetsLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          subdomains: ['0', '1', '2', '3'],
          maxZoom: 20,
        }).addTo(map);

        // Fallback to OpenStreetMap if Google tiles encounter network errors
        googleStreetsLayer.on('tileerror', () => {
          if (!osmFallbackAdded) {
            osmFallbackAdded = true;
            console.warn('[DeliveryLocationMap] Google tile error, activating OpenStreetMap fallback');
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
            }).addTo(map);
          }
        });

        // Add Delivery Partner GPS Location Marker
        const icon = createMarkerIcon(L, isVerified, verifiedZoneName);
        const marker = L.marker([safeLat, safeLng], {
          icon,
          draggable: true,
          zIndexOffset: 1000,
        }).addTo(map);

        // Allow dragging marker to update coordinates
        marker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          const newLat = Number(pos.lat.toFixed(6));
          const newLng = Number(pos.lng.toFixed(6));
          console.info(`[DeliveryLocationMap] Marker dragged to lat=${newLat}, lng=${newLng}`);
          onLocationChange(newLat, newLng);
        });

        // Allow clicking on map to move marker and update coordinates
        map.on('click', (e: any) => {
          const clickLat = Number(e.latlng.lat.toFixed(6));
          const clickLng = Number(e.latlng.lng.toFixed(6));
          console.info(`[DeliveryLocationMap] Map clicked at lat=${clickLat}, lng=${clickLng}`);
          marker.setLatLng([clickLat, clickLng]);
          onLocationChange(clickLat, clickLng);
        });

        markerRef.current = marker;
        mapInstanceRef.current = map;

        // Render admin zone boundaries
        renderZonesOverlays(map, L);

        // Auto invalidate size on resize
        setTimeout(() => {
          map.invalidateSize();
        }, 150);

        if (typeof ResizeObserver !== 'undefined' && mapDomRef.current) {
          const ro = new ResizeObserver(() => {
            map.invalidateSize();
          });
          ro.observe(mapDomRef.current);
        }

        setMapReady(true);
      })
      .catch((err) => {
        console.error('[DeliveryLocationMap] Failed to initialize map', err);
        setMapError(err?.message || 'Failed to load map engine.');
      });
  }, [safeLat, safeLng, isVerified, verifiedZoneName, createMarkerIcon, onLocationChange, renderZonesOverlays]);

  // Mount effect
  useEffect(() => {
    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markerRef.current = null;
      zonesLayerGroupRef.current = null;
    };
  }, []);

  // Update marker position and zone overlays when coordinates/status change
  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).L) return;
    const L = (window as any).L;

    if (markerRef.current) {
      markerRef.current.setLatLng([safeLat, safeLng]);
      markerRef.current.setIcon(createMarkerIcon(L, isVerified, verifiedZoneName));
    }

    renderZonesOverlays(mapInstanceRef.current, L);
  }, [safeLat, safeLng, isVerified, verifiedZoneName, createMarkerIcon, renderZonesOverlays]);

  // Map controls
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([safeLat, safeLng], 15, {
        duration: 0.8,
      });
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // Fetch actual GPS location from device
  const fetchGpsLocation = async () => {
    setIsFetchingGps(true);
    setGpsError(null);

    try {
      // 1. Check & Request Location Permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        const msg = 'Location permission denied. Please allow location access in your browser or device settings.';
        setGpsError(msg);
        if (typeof window !== 'undefined') {
          window.alert(msg);
        } else {
          Alert.alert('Permission Denied', msg);
        }
        setIsFetchingGps(false);
        return;
      }

      // 2. Fetch coordinates with fallback
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
        throw new Error('Unable to retrieve GPS coordinates. Please ensure location/GPS is enabled.');
      }

      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));

      // 3. Reverse Geocode address for reference display
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
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 1.0 });
      }

      // 5. Notify parent with new coordinates
      onLocationChange(lat, lng, refAddress);
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to detect current GPS location. Please try again.';
      setGpsError(errMsg);
      if (typeof window !== 'undefined') {
        window.alert(errMsg);
      } else {
        Alert.alert('Location Error', errMsg);
      }
    } finally {
      setIsFetchingGps(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map View Frame */}
      <View style={[styles.mapFrame, { height }]}>
        {/* Real Interactive Leaflet Map DOM Element */}
        <div
          ref={mapDomRef}
          className="foodie-map-container"
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#E2E8F0',
          }}
        />

        {/* Map Load Error Banner */}
        {mapError && (
          <View style={styles.errorOverlay}>
            <Text variant="caption" style={{ color: ERROR_RED, fontWeight: '700', fontSize: 13 }}>
              ⚠️ Map Failed to Load
            </Text>
            <Text variant="caption" style={{ color: '#475569', marginTop: 4, textAlign: 'center', fontSize: 11 }}>
              {mapError}
            </Text>
            <Pressable onPress={initMap} style={styles.retryButton}>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>
                ↻ Retry Loading Map
              </Text>
            </Pressable>
          </View>
        )}

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
        {(isFetchingGps || isVerifying || !mapReady) && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={BRAND_AMBER} />
            <Text variant="body" style={styles.loadingText}>
              {isFetchingGps
                ? 'Detecting device GPS location...'
                : isVerifying
                ? 'Verifying delivery zone on server...'
                : 'Loading interactive map...'}
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
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 25,
  },
  retryButton: {
    marginTop: 10,
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
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
