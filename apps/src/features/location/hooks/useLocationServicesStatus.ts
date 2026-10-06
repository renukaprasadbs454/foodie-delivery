import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
  checkLocationServicesStatus,
  openDeviceSettings,
  requestAllLocationPermissions,
  requestForegroundLocationPermission,
  requestBackgroundLocationPermission,
} from '../locationService';
import type { LocationServicesStatus, LocationPermissionStatus } from '../types';

export function useLocationServicesStatus() {
  const [status, setStatus] = useState<LocationServicesStatus>({
    foregroundPermission: 'undetermined',
    backgroundPermission: 'undetermined',
    gpsEnabled: true,
    canAskAgainForeground: true,
    canAskAgainBackground: true,
    isTrackingActive: false,
    trackingTier: 'offline',
    lastKnownLocation: null,
    lastPingAt: null,
    errorMessage: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshStatus = useCallback(async () => {
    try {
      const perms = await checkLocationServicesStatus();
      setStatus((prev) => ({
        ...prev,
        foregroundPermission: perms.foregroundPermission,
        backgroundPermission: perms.backgroundPermission,
        gpsEnabled: perms.gpsEnabled,
        canAskAgainForeground: perms.canAskAgainForeground,
        canAskAgainBackground: perms.canAskAgainBackground,
      }));
    } catch (err: any) {
      setStatus((prev) => ({
        ...prev,
        errorMessage: err?.message || 'Failed to check location status',
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  // Requirement 9: Handle permission changes when partner returns from device settings & refresh automatically
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        void refreshStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [refreshStatus]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await requestAllLocationPermissions();
      setStatus((prev) => ({
        ...prev,
        foregroundPermission: res.foregroundPermission,
        backgroundPermission: res.backgroundPermission,
        gpsEnabled: res.gpsEnabled,
      }));
      return res.foregroundPermission === 'granted' && res.gpsEnabled;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openSettings = useCallback(async () => {
    await openDeviceSettings();
  }, []);

  return {
    status,
    isLoading,
    refreshStatus,
    requestPermissions,
    openSettings,
  };
}
