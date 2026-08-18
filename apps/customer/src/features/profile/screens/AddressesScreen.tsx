import React, { useEffect, useState, useRef } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Switch, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  Text,
  TextInput,
  Modal,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import * as Location from 'expo-location';
import MapView, { Marker, Region } from 'react-native-maps';
import {
  useAddAddressMutation,
  useGetAddressesQuery,
  useRemoveAddressMutation,
} from '../../../api/endpoints/addressesApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import type {
  BrowseStackParamList,
  ProfileStackParamList,
} from '../../../navigation/types';
import { AddressCard } from '../components/AddressCard';
import { AddressListSkeleton } from '../components/AddressListSkeleton';
import { validateAddressForm } from '../types';

type ProfileProps = NativeStackScreenProps<ProfileStackParamList, 'Addresses'>;
type BrowseProps = NativeStackScreenProps<BrowseStackParamList, 'Addresses'>;
type Props = ProfileProps | BrowseProps;

/**
 * P2-CUS-07 Addresses — list/add/remove. No update endpoint (Gap).
 * selectMode from Checkout returns after create/select.
 * P2-OPT-01 — FlatList virtualization (SD §25).
 */
export function AddressesScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const selectMode = Boolean(route.params?.selectMode);
  const addressesQuery = useGetAddressesQuery();
  const [addAddress, addState] = useAddAddressMutation();
  const [removeAddress, removeState] = useRemoveAddressMutation();

  const [formVisible, setFormVisible] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: 12.9716,
    longitude: 77.5946, // Default Bangalore
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const mapRef = useRef<MapView>(null);

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
    trackAnalyticsEvent('customer_addresses_viewed');
  }, []);

  const resetForm = () => {
    setLabel('Home');
    setLine1('');
    setLine2('');
    setCity('');
    setPincode('');
    setLatitude('');
    setLongitude('');
    setIsDefault(true);
  };

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
      setLatitude(loc.coords.latitude.toString());
      setLongitude(loc.coords.longitude.toString());
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
    } catch (err) {
      setToast({ message: 'Failed to fetch location.', variant: 'warning' });
    } finally {
      setFetchingLocation(false);
    }
  };

  const openAddForm = () => {
    resetForm();
    setFormVisible(true);
    void fetchExactLocation();
  };

  const onAdd = async () => {
    const validated = validateAddressForm({
      label,
      line1,
      line2,
      city,
      pincode,
      latitude,
      longitude,
      isDefault,
    });
    if (!validated.ok) {
      setToast({ message: validated.message, variant: 'error' });
      return;
    }
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to add an address.',
        variant: 'warning',
      });
      return;
    }
    try {
      const created = await addAddress(validated.value).unwrap();
      trackAnalyticsEvent('address_added', { addressId: created.addressId });
      trackAnalyticsEvent('address_created', { addressId: created.addressId });
      setFormVisible(false);
      resetForm();
      setToast({ message: 'Address added.', variant: 'success' });
      if (selectMode) {
        navigation.goBack();
      }
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  const onRemove = async (addressId: string) => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to remove an address.',
        variant: 'warning',
      });
      return;
    }
    setRemovingId(addressId);
    try {
      await removeAddress(addressId).unwrap();
      trackAnalyticsEvent('address_removed', { addressId });
      setToast({ message: 'Address removed.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    } finally {
      setRemovingId(null);
    }
  };

  const addresses = addressesQuery.data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#14532D' }} edges={['top', 'left', 'right']}>
      <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
        <FlatList
          style={{ flex: 1 }}
          data={
            addressesQuery.isLoading && addresses.length === 0 ? [] : addresses
          }
          keyExtractor={(item) => item.addressId}
          contentContainerStyle={{
            paddingBottom: 48,
            flexGrow: 1,
          }}
          refreshControl={
            <RefreshControl
              refreshing={addressesQuery.isFetching}
              onRefresh={() => {
                void addressesQuery.refetch();
              }}
            />
          }
          ListHeaderComponent={
            <View style={{
              paddingTop: 12,
              paddingBottom: 20,
              paddingHorizontal: 20,
              backgroundColor: '#14532D',
              borderBottomLeftRadius: 32,
              borderBottomRightRadius: 32,
              shadowColor: '#14532D',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 5,
              marginBottom: 16,
            }}>
              <Text style={{ color: '#FCD34D', fontWeight: '900', fontSize: 24, letterSpacing: -0.5 }}>
                Delivery Addresses
              </Text>
              {!isConnected ? (
                <Text variant="caption" color="#A7F3D0" style={{ marginTop: 4 }}>
                  Offline — showing cached addresses. Changes are blocked.
                </Text>
              ) : null}
              {addressesQuery.isLoading && addresses.length === 0 ? (
                <AddressListSkeleton />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            addressesQuery.isLoading && addresses.length === 0 ? null : (
              <View style={{ paddingHorizontal: tokens.spacing.md }}>
                <EmptyState
                  title="No addresses yet"
                  description="Add a delivery address for checkout."
                  accessibilityLabel="Addresses empty"
                  actionLabel="Add New Address"
                  onAction={openAddForm}
                />
              </View>
            )
          }
          ListFooterComponent={
            <View style={{ paddingHorizontal: tokens.spacing.md, marginTop: 16 }}>
              <Pressable
                accessibilityLabel="Add address"
                onPress={openAddForm}
                style={({ pressed }) => ({
                  backgroundColor: '#14532D',
                  borderColor: '#FCD34D',
                  borderWidth: 1.5,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: pressed ? 0.9 : 1,
                })}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 16 }}>+ Add New Address</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item: address }) => (
            <View style={{ paddingHorizontal: tokens.spacing.md, marginVertical: tokens.spacing.xs }}>
              <AddressCard
                address={address}
                selectMode={selectMode}
                removing={removingId === address.addressId && removeState.isLoading}
                onRemove={() => {
                  void onRemove(address.addressId);
                }}
                onSelect={
                  selectMode
                    ? () => {
                      trackAnalyticsEvent('address_selected', {
                        addressId: address.addressId,
                      });
                      navigation.goBack();
                    }
                    : undefined
                }
              />
            </View>
          )}
        />

        <Modal
          visible={formVisible}
          onRequestClose={() => setFormVisible(false)}
          title="Add Delivery Address"
          accessibilityLabel="Add address dialog"
        >
          <ScrollView style={{ maxHeight: 600 }}>
            <View style={{ gap: tokens.spacing.md }}>
              <View style={{ height: 180, borderRadius: 12, overflow: 'hidden', borderColor: '#F59E0B', borderWidth: 1 }}>
                <MapView
                  ref={mapRef}
                  style={{ flex: 1 }}
                  region={mapRegion}
                  onRegionChangeComplete={(r) => {
                    setMapRegion(r);
                    setLatitude(r.latitude.toString());
                    setLongitude(r.longitude.toString());
                  }}
                >
                  <Marker coordinate={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }} pinColor="#14532D" />
                </MapView>
                {fetchingLocation && (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#F59E0B" />
                    <Text style={{ color: '#F59E0B', fontWeight: '800', marginTop: 8 }}>Pinpointing location...</Text>
                  </View>
                )}
              </View>

              <Pressable onPress={fetchExactLocation} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16 }}>📍</Text>
                <Text style={{ color: '#F59E0B', fontWeight: '700', fontSize: 14 }}>Locate Me</Text>
              </Pressable>

              <View style={{ flexDirection: 'row', gap: tokens.spacing.md }}>
                {['Home', 'Work', 'Other'].map(l => (
                  <Pressable
                    key={l}
                    onPress={() => setLabel(l)}
                    style={{
                      flex: 1, padding: 10, borderRadius: 8, borderWidth: 1,
                      borderColor: label === l ? '#14532D' : tokens.color.border,
                      backgroundColor: label === l ? '#14532D' : tokens.color.surface,
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: label === l ? '#FFFFFF' : tokens.color.textSecondary, fontWeight: '800' }}>{l}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                label="Complete Address (House No, Building, Street)"
                value={line1}
                onChangeText={setLine1}
                accessibilityLabel="Address line 1"
              />
              <TextInput
                label="Landmark / Area (Optional)"
                value={line2}
                onChangeText={setLine2}
                accessibilityLabel="Address line 2"
              />
              <View style={{ flexDirection: 'row', gap: tokens.spacing.md }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="City"
                    value={city}
                    onChangeText={setCity}
                    accessibilityLabel="City"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Pincode"
                    value={pincode}
                    onChangeText={setPincode}
                    keyboardType="number-pad"
                    maxLength={6}
                    accessibilityLabel="Pincode"
                  />
                </View>
              </View>

              <Button
                label="Save Address and Proceed"
                accessibilityLabel="Save address"
                loading={addState.isLoading}
                onPress={() => {
                  void onAdd();
                }}
              />
            </View>
          </ScrollView>
        </Modal>

        <Toast
          visible={Boolean(toast)}
          message={toast?.message ?? ''}
          variant={toast?.variant ?? 'info'}
          accessibilityLabel={toast?.message ?? 'Toast'}
          onDismiss={() => setToast(null)}
        />
      </View>
    </SafeAreaView>
  );
}
