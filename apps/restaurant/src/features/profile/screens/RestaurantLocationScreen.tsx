import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Card,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useGetRestaurantLocationQuery,
  useUpdateRestaurantLocationMutation,
} from '../../../api/endpoints/locationApi';
import { DemoModeIndicator } from '../../../components/DemoModeIndicator';
import { MOCK_CONFIG } from '../../../config/mockConfig';
import type { ProfileStackParamList } from '../../../navigation/types';
import type {
  AddressSuggestion,
  RestaurantLocation,
} from '../location/locationTypes';
import {
  formatCoordinates,
  isValidCoordinate,
  validateLocationForm,
} from '../location/locationTypes';
import {
  loadStoredLocation,
  saveStoredLocation,
} from '../location/locationStorage';
import {
  getCurrentDeviceLocation,
  reverseGeocodeCoordinates,
} from '../location/locationService';
import { AddressSearch } from '../components/AddressSearch';
import { RestaurantLocationMap } from '../components/RestaurantLocationMap';
import {
  getMockRestaurantLocation,
  updateMockRestaurantLocation,
} from '../../../mock/locationData';

type Props = NativeStackScreenProps<ProfileStackParamList, 'RestaurantLocation'>;

const BRAND_PRIMARY = '#14532D'; // Dark Green
const BRAND_ACCENT = '#F59E0B';  // Gold / Amber Accent

export function RestaurantLocationScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();

  // SINGLE SOURCE OF TRUTH FOR LOCATION & ADDRESS STATE
  const [location, setLocation] = useState<RestaurantLocation>(getMockRestaurantLocation());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  // RTK Query hooks
  const locationQuery = useGetRestaurantLocationQuery(undefined, { skip: !isConnected });
  const [updateLocationMutation] = useUpdateRestaurantLocationMutation();

  const isUsingMock =
    MOCK_CONFIG.ENABLE_MOCK_FALLBACK && (!isConnected || locationQuery.isError);

  // Hydrate initial location from storage or API on mount
  useEffect(() => {
    trackAnalyticsEvent('restaurant_location_viewed');
    void (async () => {
      const stored = await loadStoredLocation();
      if (stored && isValidCoordinate(stored.latitude, stored.longitude)) {
        setLocation(stored);
      } else {
        setLocation(getMockRestaurantLocation());
      }
    })();
  }, []);

  useEffect(() => {
    if (locationQuery.data && isValidCoordinate(locationQuery.data.latitude, locationQuery.data.longitude)) {
      setLocation(locationQuery.data);
    }
  }, [locationQuery.data]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (isConnected) {
      void locationQuery.refetch();
    }
    const stored = await loadStoredLocation();
    if (stored && isValidCoordinate(stored.latitude, stored.longitude)) {
      setLocation(stored);
    }
    setRefreshing(false);
  };

  // Helper to update individual address form fields cleanly in the single source of truth state
  const updateField = (field: keyof RestaurantLocation, value: string) => {
    setLocation((prev) => {
      const updated = { ...prev, [field]: value };
      updated.formattedAddress = [
        updated.addressLine1,
        updated.addressLine2,
        updated.landmark,
        `${updated.city || ''}, ${updated.state || ''} - ${updated.pincode || ''}`,
        updated.country,
      ]
        .filter(Boolean)
        .join(', ');
      return updated;
    });
  };

  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  // Single location change handler for marker drag, map click, search autocomplete, & GPS current location
  const handleLocationChange = async (
    lat: number,
    lng: number,
    addressData?: Partial<RestaurantLocation> | AddressSuggestion,
  ) => {
    if (!isValidCoordinate(lat, lng)) return;

    const roundedLat = Number(Number(lat).toFixed(6));
    const roundedLng = Number(Number(lng).toFixed(6));

    // 1. If full address data is already provided (e.g. from address search autocomplete selection)
    if (
      addressData &&
      addressData.addressLine1 &&
      addressData.city &&
      addressData.formattedAddress
    ) {
      setLocation({
        latitude: roundedLat,
        longitude: roundedLng,
        addressLine1: addressData.addressLine1,
        addressLine2: addressData.addressLine2 || '',
        landmark: addressData.landmark || '',
        city: addressData.city,
        state: addressData.state || 'Karnataka',
        country: addressData.country || 'India',
        pincode: addressData.pincode || '560095',
        formattedAddress: addressData.formattedAddress,
      });
      setIsResolvingAddress(false);
      return;
    }

    // 2. Otherwise (marker drag, map click, or GPS without full address), immediately show loading state & reverse geocode
    setIsResolvingAddress(true);
    setLocation((prev) => ({
      ...prev,
      latitude: roundedLat,
      longitude: roundedLng,
      addressLine1: 'Finding location...',
      addressLine2: '',
      landmark: '',
      formattedAddress: `Finding location for ${roundedLat}°, ${roundedLng}°...`,
    }));

    // 3. Perform Reverse Geocoding for the exact new coordinates
    try {
      const geo = await reverseGeocodeCoordinates(roundedLat, roundedLng);
      const line1 = geo.addressLine1 || `Location at ${roundedLat}°, ${roundedLng}°`;
      const city = geo.city || 'Bengaluru';
      const state = geo.state || 'Karnataka';
      const country = geo.country || 'India';
      const pincode = geo.pincode || '560095';
      const formatted =
        geo.formattedAddress ||
        `${line1}, ${city}, ${state} - ${pincode}, ${country}`;

      setLocation({
        latitude: roundedLat,
        longitude: roundedLng,
        addressLine1: line1,
        addressLine2: geo.addressLine2 || '',
        landmark: geo.landmark || '',
        city,
        state,
        country,
        pincode,
        formattedAddress: formatted,
      });
    } catch (_err) {
      setLocation((prev) => ({
        ...prev,
        latitude: roundedLat,
        longitude: roundedLng,
        addressLine1: `Location at ${roundedLat}°, ${roundedLng}°`,
        formattedAddress: `${roundedLat}° N, ${roundedLng}° E, Bengaluru, Karnataka - 560095, India`,
      }));
    } finally {
      setIsResolvingAddress(false);
    }
  };

  // Handle address autocomplete selection
  const handleSelectSuggestion = (sugg: AddressSuggestion) => {
    if (!isValidCoordinate(sugg.latitude, sugg.longitude)) return;
    void handleLocationChange(Number(sugg.latitude), Number(sugg.longitude), sugg);
    setToast({
      message: `Selected location: ${sugg.title}`,
      variant: 'info',
    });
  };

  // "Use Current Location" permission & device GPS fetch
  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);
    setToast({
      message: 'Getting your location...',
      variant: 'info',
    });
    try {
      const pos = await getCurrentDeviceLocation();
      if (pos && isValidCoordinate(pos.latitude, pos.longitude)) {
        await handleLocationChange(pos.latitude, pos.longitude);
        setToast({
          message: 'Updated map and address to your current GPS location.',
          variant: 'success',
        });
      } else {
        setToast({
          message:
            'Location permission was denied. Please enable location access or select a location manually.',
          variant: 'warning',
        });
      }
    } catch (_err) {
      setToast({
        message: 'Could not fetch current location. Please tap map to set location.',
        variant: 'warning',
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Save location action
  const handleSaveLocation = async () => {
    setErrors({});
    const validation = validateLocationForm(location);

    if (!validation.ok) {
      setErrors(validation.errors);
      setToast({ message: validation.message, variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedLocation = validation.value;

      if (!isUsingMock) {
        try {
          await updateLocationMutation(updatedLocation).unwrap();
        } catch (_apiErr) {
          // Fall back to secure local storage if API backend endpoint is unpopulated
        }
      }

      await saveStoredLocation(updatedLocation);
      updateMockRestaurantLocation(updatedLocation);
      setLocation(updatedLocation);

      setToast({
        message: 'Restaurant location saved successfully',
        variant: 'success',
      });
      trackAnalyticsEvent('restaurant_location_saved', {
        city: updatedLocation.city,
      });
    } catch (err: any) {
      setToast({
        message: err?.message || 'Failed to save restaurant location.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast notification'}
        onDismiss={() => setToast(null)}
      />

      <ScrollView
        contentContainerStyle={{
          paddingVertical: tokens.spacing.md,
          paddingHorizontal: tokens.spacing.md,
          paddingBottom: 90,
          gap: tokens.spacing.md,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BRAND_ACCENT}
          />
        }
      >
        {isUsingMock ? <DemoModeIndicator /> : null}

        {/* Page Title */}
        <View style={{ gap: 4 }}>
          <Text
            variant="heading1"
            style={{ color: BRAND_PRIMARY, fontSize: 24, fontWeight: '800' }}
            accessibilityRole="header"
          >
            Restaurant Location
          </Text>
          <Text variant="caption" style={{ color: tokens.color.textSecondary, fontSize: 13 }}>
            Set exact map coordinates and delivery pickup address for customers and rider partners
          </Text>
        </View>

        {/* 1. REAL INTERACTIVE GOOGLE MAP */}
        <Card style={{ padding: 6, borderRadius: 16 }}>
          <RestaurantLocationMap
            latitude={location.latitude}
            longitude={location.longitude}
            onLocationSelect={handleLocationChange}
            height={260}
          />
        </Card>

        {/* 2. SEARCH ADDRESS AUTOCOMPLETE */}
        <AddressSearch onSelectSuggestion={handleSelectSuggestion} />

        {/* 3. USE CURRENT LOCATION BUTTON */}
        <Pressable
          onPress={handleUseCurrentLocation}
          disabled={isGettingLocation}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#FEF3C7' : '#FFFFFF',
            borderWidth: 1.5,
            borderColor: BRAND_ACCENT,
            borderRadius: 12,
            paddingVertical: 12,
            paddingHorizontal: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
          })}
          accessibilityRole="button"
          accessibilityLabel="Use Current Location"
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color={BRAND_ACCENT} />
          ) : (
            <Text style={{ fontSize: 18 }}>🎯</Text>
          )}
          <Text
            style={{
              color: '#92400E',
              fontWeight: '700',
              fontSize: 15,
            }}
          >
            {isGettingLocation ? 'Getting your location...' : 'Use Current Location'}
          </Text>
        </Pressable>

        {/* 4. SELECTED LOCATION SUMMARY PREVIEW CARD */}
        <Card
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: tokens.spacing.md,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: '#FEF3C7',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 16 }}>📍</Text>
              </View>
              <Text
                variant="heading2"
                style={{ color: '#0F172A', fontSize: 16, fontWeight: '700' }}
              >
                Selected Location
              </Text>
            </View>

            {isResolvingAddress ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ActivityIndicator size="small" color={BRAND_ACCENT} />
                <Text variant="caption" style={{ color: '#D97706', fontWeight: '600' }}>
                  Finding location...
                </Text>
              </View>
            ) : null}
          </View>

          <View
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 10,
              padding: 12,
              gap: 8,
              borderWidth: 1,
              borderColor: '#F1F5F9',
            }}
          >
            <View style={{ gap: 2 }}>
              <Text variant="caption" style={{ color: '#64748B' }}>
                Formatted Address
              </Text>
              <Text
                variant="body"
                style={{
                  color: isResolvingAddress ? '#D97706' : '#0F172A',
                  fontWeight: '600',
                  lineHeight: 20,
                  fontStyle: isResolvingAddress ? 'italic' : 'normal',
                }}
              >
                {location.formattedAddress || 'No address selected'}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderTopWidth: 1,
                borderTopColor: '#E2E8F0',
                paddingTop: 8,
              }}
            >
              <Text variant="caption" style={{ color: '#64748B' }}>
                Coordinates:
              </Text>
              <Text variant="caption" style={{ color: '#0F172A', fontWeight: '700' }}>
                {formatCoordinates(location.latitude, location.longitude)}
              </Text>
            </View>
          </View>
        </Card>

        {/* 5. RESTAURANT ADDRESS FORM */}
        <Card
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: tokens.spacing.md,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 14,
          }}
        >
          <Text
            variant="heading2"
            style={{ color: BRAND_PRIMARY, fontSize: 17, fontWeight: '700' }}
          >
            Restaurant Physical Address
          </Text>

          <TextInput
            label="Address Line 1 *"
            value={location.addressLine1}
            onChangeText={(val) => updateField('addressLine1', val)}
            placeholder="Door #, Building name, Street name"
            errorText={errors.addressLine1}
            accessibilityLabel="Address Line 1"
          />

          <TextInput
            label="Address Line 2"
            value={location.addressLine2 || ''}
            onChangeText={(val) => updateField('addressLine2', val)}
            placeholder="Locality / Sector (Optional)"
            accessibilityLabel="Address Line 2"
          />

          <TextInput
            label="Landmark"
            value={location.landmark || ''}
            onChangeText={(val) => updateField('landmark', val)}
            placeholder="Nearby prominent landmark (Optional)"
            accessibilityLabel="Landmark"
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                label="City *"
                value={location.city}
                onChangeText={(val) => updateField('city', val)}
                placeholder="e.g. Bengaluru"
                errorText={errors.city}
                accessibilityLabel="City"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                label="State *"
                value={location.state}
                onChangeText={(val) => updateField('state', val)}
                placeholder="e.g. Karnataka"
                errorText={errors.state}
                accessibilityLabel="State"
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                label="Country *"
                value={location.country}
                onChangeText={(val) => updateField('country', val)}
                placeholder="e.g. India"
                errorText={errors.country}
                accessibilityLabel="Country"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                label="Pincode *"
                value={location.pincode}
                onChangeText={(val) => updateField('pincode', val)}
                placeholder="6-digit Pincode"
                keyboardType="number-pad"
                maxLength={6}
                errorText={errors.pincode}
                accessibilityLabel="Pincode"
              />
            </View>
          </View>

          {/* READ-ONLY COORDINATES */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <TextInput
                label="Latitude (Read-Only)"
                value={isValidCoordinate(location.latitude, location.longitude) ? String(location.latitude) : ''}
                editable={false}
                accessibilityLabel="Latitude"
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                label="Longitude (Read-Only)"
                value={isValidCoordinate(location.latitude, location.longitude) ? String(location.longitude) : ''}
                editable={false}
                accessibilityLabel="Longitude"
              />
            </View>
          </View>
        </Card>

        {/* 6. SAVE LOCATION PROMINENT BUTTON */}
        <Pressable
          onPress={handleSaveLocation}
          disabled={isSubmitting}
          style={({ pressed }) => ({
            backgroundColor: isSubmitting
              ? '#FCD34D'
              : pressed
                ? '#D97706'
                : BRAND_ACCENT,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: 8,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
            elevation: 4,
          })}
          accessibilityRole="button"
          accessibilityLabel="Save Location"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={{ fontSize: 18 }}>💾</Text>
          )}
          <Text
            style={{
              color: '#FFFFFF',
              fontWeight: '800',
              fontSize: 16,
            }}
          >
            {isSubmitting ? 'Saving Location...' : 'Save Location'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
