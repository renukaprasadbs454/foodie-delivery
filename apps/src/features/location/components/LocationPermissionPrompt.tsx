import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Platform,
  Dimensions,
  AppState,
  type AppStateStatus,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { useLocationServicesStatus } from '../hooks/useLocationServicesStatus';

const { width } = Dimensions.get('window');

/**
 * LocationPermissionPrompt:
 * Prompts the Delivery Partner on app launch if device/browser location permission
 * is not granted or if location services (GPS) are turned off.
 */
export function LocationPermissionPrompt() {
  const { status, isLoading, refreshStatus, requestPermissions, openSettings } =
    useLocationServicesStatus();

  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Check if permissions are satisfied
  const isGranted =
    status.foregroundPermission === 'granted' &&
    (Platform.OS === 'web' || status.backgroundPermission === 'granted' || status.backgroundPermission === 'undetermined') &&
    status.gpsEnabled;

  const isGpsDisabled = !status.gpsEnabled;
  const isBlocked =
    status.foregroundPermission === 'denied' && !status.canAskAgainForeground;

  // Re-check when app regains focus (e.g. returning from device settings)
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void refreshStatus();
      }
    };

    const sub = AppState.addEventListener('change', handleAppState);

    // On web, also listen to window focus
    let webFocusHandler: (() => void) | undefined;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      webFocusHandler = () => {
        void refreshStatus();
      };
      window.addEventListener('focus', webFocusHandler);
    }

    return () => {
      sub.remove();
      if (webFocusHandler && typeof window !== 'undefined') {
        window.removeEventListener('focus', webFocusHandler);
      }
    };
  }, [refreshStatus]);

  // If already granted, loading, or dismissed for this session, do not show
  if (isLoading || isGranted || dismissed) {
    return null;
  }

  const handleAllow = async () => {
    setRequesting(true);
    try {
      const granted = await requestPermissions();
      if (granted) {
        setDismissed(true);
      }
    } catch (e) {
      console.warn('[LocationPrompt] Error requesting permissions:', e);
    } finally {
      setRequesting(false);
    }
  };

  const handleOpenSettings = async () => {
    await openSettings();
  };

  const handleCheckAgain = async () => {
    setRequesting(true);
    try {
      await refreshStatus();
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={() => setDismissed(true)}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Top Icon Badge */}
          <View
            style={[
              styles.iconCircle,
              isGpsDisabled || isBlocked
                ? styles.iconCircleWarning
                : styles.iconCirclePrimary,
            ]}
          >
            {isGpsDisabled ? (
              <Feather name="alert-triangle" size={32} color="#D97706" />
            ) : isBlocked ? (
              <Feather name="slash" size={32} color="#DC2626" />
            ) : (
              <Ionicons name="location" size={36} color="#14532D" />
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isGpsDisabled
              ? 'Enable Device Location (GPS)'
              : isBlocked
              ? 'Location Permission Required'
              : 'Allow Location Access'}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {isGpsDisabled
              ? 'Location services are turned off on your device. Please turn on GPS so Foodie can assign orders and provide live navigation.'
              : isBlocked
              ? Platform.OS === 'web'
                ? 'Location access was blocked in your browser. Please allow location in your browser site settings and click "Check Again".'
                : 'Location permission is disabled in device settings. Please allow location access to continue delivery operations.'
              : 'Foodie Delivery requires location access to find nearby delivery offers, navigate to pickup & dropoff points, and update delivery status in real-time.'}
          </Text>

          {/* Key Feature Benefits */}
          <View style={styles.benefitsContainer}>
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconBg}>
                <Feather name="navigation" size={14} color="#14532D" />
              </View>
              <Text style={styles.benefitText}>
                Receive nearby restaurant order offers
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconBg}>
                <Feather name="map-pin" size={14} color="#14532D" />
              </View>
              <Text style={styles.benefitText}>
                Accurate turn-by-turn route navigation
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <View style={styles.benefitIconBg}>
                <Feather name="shield" size={14} color="#14532D" />
              </View>
              <Text style={styles.benefitText}>
                Real-time tracking for customer & partner safety
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {isGpsDisabled || isBlocked ? (
              <>
                {Platform.OS !== 'web' ? (
                  <Button
                    label="Open Settings"
                    variant="primary"
                    accessibilityLabel="Open device settings"
                    onPress={handleOpenSettings}
                    loading={requesting}
                  />
                ) : null}
                <Button
                  label="Check Again"
                  variant={Platform.OS === 'web' ? 'primary' : 'secondary'}
                  accessibilityLabel="Check location permission status again"
                  onPress={handleCheckAgain}
                  loading={requesting}
                />
              </>
            ) : (
              <Button
                label="Allow Location Access"
                variant="primary"
                accessibilityLabel="Allow location access"
                onPress={handleAllow}
                loading={requesting}
              />
            )}

            <Pressable
              onPress={() => setDismissed(true)}
              style={({ pressed }) => [
                styles.dismissButton,
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Dismiss location prompt for now"
            >
              <Text style={styles.dismissText}>Not Now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: Math.min(width - 32, 420),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCirclePrimary: {
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  iconCircleWarning: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FCD34D',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitIconBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
    flex: 1,
  },
  actionsContainer: {
    width: '100%',
    gap: 10,
  },
  dismissButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
});
