export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export type LocationTrackingTier = 'offline' | 'online_idle' | 'active_delivery';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface LocationServicesStatus {
  foregroundPermission: LocationPermissionStatus;
  backgroundPermission: LocationPermissionStatus;
  gpsEnabled: boolean;
  canAskAgainForeground: boolean;
  canAskAgainBackground: boolean;
  isTrackingActive: boolean;
  trackingTier: LocationTrackingTier;
  lastKnownLocation: LocationCoordinates | null;
  lastPingAt: number | null;
  errorMessage: string | null;
}

/** Configured intervals */
export const LOCATION_INTERVALS = {
  /** Live active delivery navigation tracking interval (elevated tier) */
  ACTIVE_DELIVERY_MS: 3_000,
  /** Online idle availability tracking interval */
  ONLINE_IDLE_MS: 30_000,
} as const;
