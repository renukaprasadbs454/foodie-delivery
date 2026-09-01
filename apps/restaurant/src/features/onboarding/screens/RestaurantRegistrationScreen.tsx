import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import {
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
} from 'foodie-shared-rn';
import { useRegisterRestaurantMutation, restaurantsApi } from '../../../api/endpoints/restaurantsApi';
import { useAppDispatch } from '../../../store/hooks';
import { clearIsNewUser } from '../../auth/authSlice';
import { toUnwrappedApiError } from '../../auth/apiError';
import { OnboardingStepper } from '../components/OnboardingStepper';
import { setRestaurantCreated } from '../restaurantOnboardingSlice';
import {
  CUISINE_TYPES,
  validateRegistrationForm,
  type CuisineType,
} from '../types';
import type { OnboardingStackParamList } from '../../../navigation/types';

import MapView, { Marker, Region } from 'react-native-maps';

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  'RestaurantRegistration'
>;

const BRAND_PRIMARY = '#14532D'; // Deep Emerald Green
const BRAND_ACCENT = '#F59E0B';  // Warm Gold / Amber

export function RestaurantRegistrationScreen({ navigation }: Props) {
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const [register, registerState] = useRegisterRestaurantMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [restaurantType, setRestaurantType] = useState<
    'VEGETARIAN' | 'NON_VEGETARIAN' | 'BOTH'
  >('BOTH');
  const [cuisineTypes, setCuisineTypes] = useState<CuisineType[]>([]);
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const [mapRegion, setMapRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }>({
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const mapRef = useRef<any>(null);

  const fetchExactLocation = async () => {
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setToast({ message: 'Location permission denied.', variant: 'error' });
        setFetchingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const latStr = loc.coords.latitude.toString();
      const lngStr = loc.coords.longitude.toString();
      setLatitude(latStr);
      setLongitude(lngStr);
      setMapRegion(prev => ({ ...prev, latitude: loc.coords.latitude, longitude: loc.coords.longitude }));

      const geocode = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      if (geocode.length > 0) {
        const addr = geocode[0];
        if (addr.city) setCity(addr.city);
        if (addr.postalCode) setPincode(addr.postalCode);
        if (addr.street) setLine1(addr.street);
        if (addr.name && addr.name !== addr.street) setLine2(addr.name);
      }
      setToast({ message: 'Exact location fetched!', variant: 'success' });
    } catch {
      setToast({ message: 'Failed to fetch GPS location.', variant: 'warning' });
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onInlineField: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onFullScreen: (error) =>
      setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) => setToast({ message: error.message, variant: 'error' }),
  });

  useEffect(() => {
    trackAnalyticsEvent('restaurant_registration_viewed');
  }, []);

  const toggleCuisine = (cuisine: CuisineType) => {
    setCuisineTypes((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine],
    );
  };

  const onSubmit = async () => {
    const validated = validateRegistrationForm({
      name,
      description,
      cuisineTypes,
      restaurantType,
      line1,
      line2,
      city,
      pincode,
      latitude,
      longitude,
    });
    if (!validated.ok) {
      setToast({ message: validated.message, variant: 'error' });
      return;
    }
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to register your restaurant.',
        variant: 'warning',
      });
      return;
    }
    trackAnalyticsEvent('registration_submitted');
    try {
      const result = await register(validated.value).unwrap();
      const restaurantId = result.restaurantId;
      if (!restaurantId) {
        setToast({
          message: 'Registration succeeded but restaurant id was missing.',
          variant: 'error',
        });
        return;
      }
      dispatch(
        setRestaurantCreated({
          restaurantId,
          status: result.status ?? 'PENDING',
        }),
      );
      dispatch(clearIsNewUser());
      trackAnalyticsEvent('restaurant_created', { restaurantId });
      navigation.replace('RestaurantDocuments');
    } catch (error) {
      const unwrapped = toUnwrappedApiError(error);
      if (unwrapped.status === 409 || Number(unwrapped.status) === 409) {
        try {
          const profileResponse = await dispatch(
            restaurantsApi.endpoints.getRestaurantProfile.initiate(undefined, { forceRefetch: true })
          ).unwrap();
          if (profileResponse.restaurantId) {
            dispatch(
              setRestaurantCreated({
                restaurantId: profileResponse.restaurantId,
                status: profileResponse.status ?? 'PENDING',
              }),
            );
            dispatch(clearIsNewUser());
            navigation.replace('RestaurantDocuments');
            return;
          }
        } catch (_) {
          // Fall through to default error handling
        }
      }
      handleError(unwrapped);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Banner Header (Matches Dashboard Header) */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.headerBadge}>FOODIE PARTNER ONBOARDING</Text>
              <Text style={styles.headerTitle}>Register Restaurant</Text>
              <Text style={styles.headerSubtitle}>
                Complete your profile to go live on the Foodie App
              </Text>
            </View>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 26 }}>🍳</Text>
            </View>
          </View>
        </View>

        {/* Stepper */}
        <OnboardingStepper activeIndex={0} />

        {/* Form Card 1: Basic Info */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>🏪 Outlet Information</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Restaurant Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Royal Spice Bistro"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="e.g. Authentic North Indian & Tandoori delicacies"
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Dietary Specialty */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Dietary Preference *</Text>
            <View style={styles.chipRow}>
              {[
                { id: 'BOTH', label: '🍲 Veg & Non-Veg' },
                { id: 'VEGETARIAN', label: '🌱 Pure Veg' },
                { id: 'NON_VEGETARIAN', label: '🍗 Non-Veg' },
              ].map((type) => {
                const selected = restaurantType === type.id;
                return (
                  <Pressable
                    key={type.id}
                    onPress={() =>
                      setRestaurantType(
                        type.id as 'VEGETARIAN' | 'NON_VEGETARIAN' | 'BOTH',
                      )
                    }
                    style={[
                      styles.typeChip,
                      selected && styles.typeChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        selected && styles.typeChipTextSelected,
                      ]}
                    >
                      {type.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Cuisines */}
          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Cuisines Served *</Text>
            <View style={styles.cuisineGrid}>
              {CUISINE_TYPES.map((cuisine) => {
                const selected = cuisineTypes.includes(cuisine);
                return (
                  <Pressable
                    key={cuisine}
                    onPress={() => toggleCuisine(cuisine)}
                    style={[
                      styles.cuisineChip,
                      selected && styles.cuisineChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.cuisineChipText,
                        selected && styles.cuisineChipTextSelected,
                      ]}
                    >
                      {selected ? '✓ ' : ''}
                      {cuisine.replace(/_/g, ' ')}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Form Card 2: Address & Location Map */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>📍 Location & Address Map</Text>

          {/* Interactive Map Picker */}
          <View style={{ height: 180, borderRadius: 14, overflow: 'hidden', borderColor: '#F59E0B', borderWidth: 2, marginVertical: 4 }}>
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              region={mapRegion}
              onRegionChangeComplete={(r) => {
                setMapRegion(r);
                setLatitude(r.latitude.toFixed(6));
                setLongitude(r.longitude.toFixed(6));
              }}
            >
              <Marker coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }} pinColor="#14532D" title="Restaurant Outlet" />
            </MapView>
            {fetchingLocation && (
              <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#F59E0B" />
                <Text style={{ color: '#F59E0B', fontWeight: '800', marginTop: 8 }}>Pinpointing Outlet Location...</Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={() => void fetchExactLocation()}
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: '#FEF3C7',
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#F59E0B'
            }}
          >
            <Text style={{ fontSize: 16 }}>📍</Text>
            <Text style={{ color: '#92400E', fontWeight: '800', fontSize: 13 }}>Detect GPS Outlet Location</Text>
          </Pressable>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Address Line 1 *</Text>
            <TextInput
              style={styles.input}
              placeholder="Building No, Street, Landmark"
              placeholderTextColor="#94A3B8"
              value={line1}
              onChangeText={setLine1}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.inputLabel}>Address Line 2</Text>
            <TextInput
              style={styles.input}
              placeholder="Area / Locality (Optional)"
              placeholderTextColor="#94A3B8"
              value={line2}
              onChangeText={setLine2}
            />
          </View>

          <View style={styles.inlineRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>City *</Text>
              <TextInput
                style={styles.input}
                placeholder="Bengaluru"
                placeholderTextColor="#94A3B8"
                value={city}
                onChangeText={setCity}
              />
            </View>

            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Pincode *</Text>
              <TextInput
                style={styles.input}
                placeholder="560103"
                placeholderTextColor="#94A3B8"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>


        </View>

        {/* Submit Action */}
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.primaryButtonPressed,
            registerState.isLoading && styles.buttonDisabled,
          ]}
          onPress={() => void onSubmit()}
          disabled={registerState.isLoading}
        >
          {registerState.isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Save & Proceed to Documents →
            </Text>
          )}
        </Pressable>
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 48,
  },
  headerCard: {
    backgroundColor: BRAND_PRIMARY,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND_ACCENT,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#A7F3D0',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: BRAND_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionHeader: {
    fontSize: 17,
    fontWeight: '800',
    color: BRAND_PRIMARY,
  },
  fieldGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  typeChipSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: BRAND_PRIMARY,
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  typeChipTextSelected: {
    color: BRAND_PRIMARY,
    fontWeight: '800',
  },
  cuisineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cuisineChip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cuisineChipSelected: {
    backgroundColor: BRAND_PRIMARY,
    borderColor: BRAND_PRIMARY,
  },
  cuisineChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  cuisineChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: BRAND_PRIMARY,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: BRAND_PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
