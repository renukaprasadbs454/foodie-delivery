import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Switch, View } from 'react-native';
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
    setLabel('');
    setLine1('');
    setLine2('');
    setCity('');
    setPincode('');
    setLatitude('');
    setLongitude('');
    setIsDefault(false);
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
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <FlatList
        style={{ flex: 1 }}
        data={
          addressesQuery.isLoading && addresses.length === 0 ? [] : addresses
        }
        keyExtractor={(item) => item.addressId}
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
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
          <View style={{ gap: tokens.spacing.md }}>
            <Text variant="heading1" accessibilityRole="header">
              Addresses
            </Text>
            <Text variant="caption" color={tokens.color.textSecondary}>
              Add or remove addresses. In-place edit is not available (API Gap).
            </Text>
            {!isConnected ? (
              <Text variant="caption" color={tokens.color.warning}>
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
            <EmptyState
              title="No addresses yet"
              description="Add a delivery address for checkout."
              accessibilityLabel="Addresses empty"
              actionLabel="Add address"
              onAction={() => setFormVisible(true)}
            />
          )
        }
        ListFooterComponent={
          <Button
            label="Add address"
            accessibilityLabel="Add address"
            onPress={() => setFormVisible(true)}
          />
        }
        renderItem={({ item: address }) => (
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
        )}
      />

      <Modal
        visible={formVisible}
        onRequestClose={() => setFormVisible(false)}
        title="Add address"
        accessibilityLabel="Add address dialog"
      >
        <ScrollView style={{ maxHeight: 420 }}>
          <View style={{ gap: tokens.spacing.sm }}>
            <TextInput
              label="Label"
              value={label}
              onChangeText={setLabel}
              accessibilityLabel="Address label"
            />
            <TextInput
              label="Line 1"
              value={line1}
              onChangeText={setLine1}
              accessibilityLabel="Address line 1"
            />
            <TextInput
              label="Line 2"
              value={line2}
              onChangeText={setLine2}
              accessibilityLabel="Address line 2"
            />
            <TextInput
              label="City"
              value={city}
              onChangeText={setCity}
              accessibilityLabel="City"
            />
            <TextInput
              label="Pincode"
              value={pincode}
              onChangeText={setPincode}
              accessibilityLabel="Pincode"
              keyboardType="number-pad"
              maxLength={6}
            />
            <Text variant="caption" color={tokens.color.textSecondary}>
              Map picker lands with P2-XAP-04 — enter coordinates manually.
            </Text>
            <TextInput
              label="Latitude"
              value={latitude}
              onChangeText={setLatitude}
              accessibilityLabel="Latitude"
              keyboardType="decimal-pad"
            />
            <TextInput
              label="Longitude"
              value={longitude}
              onChangeText={setLongitude}
              accessibilityLabel="Longitude"
              keyboardType="decimal-pad"
            />
            <Pressable
              onPress={() => setIsDefault((v) => !v)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 48,
              }}
              accessibilityRole="switch"
              accessibilityState={{ checked: isDefault }}
              accessibilityLabel="Set as default address"
            >
              <Text variant="body">Default address</Text>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                accessibilityLabel="Set as default address"
                accessibilityRole="switch"
                accessibilityState={{ checked: isDefault }}
              />
            </Pressable>
            <Button
              label="Save address"
              accessibilityLabel="Save address"
              loading={addState.isLoading}
              onPress={() => {
                void onAdd();
              }}
            />
            <Button
              label="Cancel"
              accessibilityLabel="Cancel add address"
              variant="secondary"
              onPress={() => setFormVisible(false)}
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
  );
}
