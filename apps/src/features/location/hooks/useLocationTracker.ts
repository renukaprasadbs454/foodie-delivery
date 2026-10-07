import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useLocationPingMutation } from '@/api/endpoints/deliveryApi';
import { useAppSelector } from '@/store/hooks';
import { selectActiveAssignment, selectIsOnline } from '../../home/availabilitySlice';
import { toUnwrappedApiError } from '../../auth/apiError';
import { LocationPingBuffer } from '../../navigation/pingBuffer';
import { validatePingCoords, type LocationPingPayload } from '../../navigation/types';
import { getCurrentDeviceLocation } from '../locationService';
import { startBackgroundLocationTracking, stopBackgroundLocationTracking } from '../backgroundTask';
import {
  LOCATION_INTERVALS,
  type LocationCoordinates,
  type LocationTrackingTier,
} from '../types';

export function useLocationTracker() {
  const isOnline = useAppSelector(selectIsOnline);
  const activeAssignment = useAppSelector(selectActiveAssignment);
  const { isConnected } = useConnectivity();
  const [pingMutation] = useLocationPingMutation();

  const [lastLocation, setLastLocation] = useState<LocationCoordinates | null>(null);
  const [lastPingAt, setLastPingAt] = useState<number | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [gpsDisabled, setGpsDisabled] = useState<boolean>(false);

  const bufferRef = useRef(new LocationPingBuffer());
  const wasConnectedRef = useRef(isConnected);

  // Determine current tracking tier based on delivery partner status
  const hasActiveDelivery = Boolean(activeAssignment?.orderId);
  const trackingTier: LocationTrackingTier = !isOnline && !hasActiveDelivery
    ? 'offline'
    : hasActiveDelivery
      ? 'active_delivery'
      : 'online_idle';

  const isTrackingActive = trackingTier !== 'offline';

  const publishLocation = useCallback(
    async (coords: LocationCoordinates) => {
      const payload: LocationPingPayload = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };

      try {
        await pingMutation(payload).unwrap();
        setLastLocation(coords);
        setLastPingAt(Date.now());
      } catch (error) {
        const mapped = toUnwrappedApiError(error);
        if (mapped.code === 'RATE_LIMITED') {
          // Rate-limited: soft ignore
          return;
        }
        if (mapped.code === 'NETWORK_ERROR') {
          bufferRef.current.push(payload);
          setLastLocation(coords);
          return;
        }
        setLastLocation(coords);
      }
    },
    [pingMutation],
  );

  const sampleAndPing = useCallback(async () => {
    if (!isTrackingActive) return;

    // 1. Check permissions
    try {
      const fg = await Location.getForegroundPermissionsAsync();
      if (!fg.granted) {
        setPermissionDenied(true);
        return;
      }
      setPermissionDenied(false);
    } catch {
      setPermissionDenied(true);
      return;
    }

    // 2. Check GPS status
    try {
      const gpsOk = await Location.hasServicesEnabledAsync();
      setGpsDisabled(!gpsOk);
      if (!gpsOk) return;
    } catch {
      // Continue if web or unsupported check
    }

    // 3. Acquire location
    const coords = await getCurrentDeviceLocation();
    if (!coords) return;

    const validated = validatePingCoords(coords.latitude, coords.longitude);
    if (!validated.ok) return;

    if (!isConnected) {
      bufferRef.current.push(validated.value);
      setLastLocation(coords);
      return;
    }

    await publishLocation(coords);
  }, [isTrackingActive, isConnected, publishLocation]);

  // Main tracking effect based on tracking tier
  useEffect(() => {
    // If offline, ensure tracking is completely stopped (Req 3 & 7)
    if (trackingTier === 'offline') {
      void stopBackgroundLocationTracking();
      return;
    }

    // Immediate initial sample
    void sampleAndPing();
    void startBackgroundLocationTracking();

    const intervalMs =
      trackingTier === 'active_delivery'
        ? LOCATION_INTERVALS.ACTIVE_DELIVERY_MS
        : LOCATION_INTERVALS.ONLINE_IDLE_MS;

    const timerId = setInterval(() => {
      void sampleAndPing();
    }, intervalMs);

    return () => {
      clearInterval(timerId);
    };
  }, [trackingTier, sampleAndPing]);

  // Offline buffer flush on network reconnection (Req 5 & SD §12.4)
  useEffect(() => {
    const wasConnected = wasConnectedRef.current;
    wasConnectedRef.current = isConnected;

    if (!wasConnected && isConnected && isTrackingActive) {
      const latest = bufferRef.current.takeMostRecentAndClear();
      if (latest) {
        void publishLocation({
          latitude: latest.latitude,
          longitude: latest.longitude,
          timestamp: Date.now(),
        });
      }
    }
  }, [isConnected, isTrackingActive, publishLocation]);

  return {
    isTrackingActive,
    trackingTier,
    lastLocation,
    lastPingAt,
    permissionDenied,
    gpsDisabled,
    sampleAndPing,
  };
}
