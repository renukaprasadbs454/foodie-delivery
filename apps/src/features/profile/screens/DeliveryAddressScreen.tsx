import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { Toast } from '@/components/Toast';
import { useConnectivity } from '@/hooks/useConnectivity';
import { useGetDeliveryProfileQuery, useUpsertDeliveryProfileMutation } from '@/api/endpoints/deliveryApi';
import type { MainStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'DeliveryAddress'>;

export function DeliveryAddressScreen({ navigation }: Props) {
  const { isConnected } = useConnectivity();
  const { data: profile, isLoading: isProfileLoading, refetch } = useGetDeliveryProfileQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [upsertProfile, { isLoading: isSaving }] = useUpsertDeliveryProfileMutation();

  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');

  const [toast, setToast] = useState<{ message: string; variant: 'info' | 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (profile) {
      if (profile.addressLine1) setAddressLine1(profile.addressLine1);
      if (profile.addressLine2) setAddressLine2(profile.addressLine2);
      if (profile.city) setCity(profile.city);
      if (profile.state) setState(profile.state);
      if (profile.pincode) setPincode(profile.pincode);
    }
  }, [profile]);

  const validate = () => {
    if (!addressLine1.trim()) {
      setToast({ message: 'Address Line 1 is required.', variant: 'error' });
      return false;
    }
    if (!city.trim()) {
      setToast({ message: 'City is required.', variant: 'error' });
      return false;
    }
    if (!state.trim()) {
      setToast({ message: 'State is required.', variant: 'error' });
      return false;
    }
    const cleanPincode = pincode.trim();
    if (!cleanPincode) {
      setToast({ message: 'Pincode is required.', variant: 'error' });
      return false;
    }
    if (!/^\d{6}$/.test(cleanPincode)) {
      setToast({ message: 'Please enter a valid 6-digit Pincode.', variant: 'error' });
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    if (isSaving) return;

    if (!isConnected) {
      setToast({ message: 'Connect to the internet to save details.', variant: 'error' });
      return;
    }

    if (!validate()) return;

    try {
      await upsertProfile({
        fullName: profile?.fullName ?? profile?.name ?? 'Delivery Partner',
        vehicleType: profile?.vehicleType ?? 'BIKE',
        vehicleNumber: profile?.vehicleNumber,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      }).unwrap();

      setToast({ message: 'Address saved successfully', variant: 'success' });
      setTimeout(() => {
        navigation.goBack();
      }, 800);
    } catch (err: any) {
      const errMsg = err?.data?.message || err?.error || 'Failed to save address. Please try again.';
      setToast({ message: errMsg, variant: 'error' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#14532D" />
        </Pressable>
        <Text style={styles.screenTitle}>Delivery Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.description}>
          Enter your current delivery address. This will be updated on your backend profile.
        </Text>

        {isProfileLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#14532D" />
            <Text style={{ marginTop: 12, color: '#64748B' }}>Loading profile address...</Text>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <TextInput
                label="Address Line 1 *"
                accessibilityLabel="Address Line 1"
                placeholder="House/Flat No., Building Name, Street"
                value={addressLine1}
                onChangeText={setAddressLine1}
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                label="Address Line 2 (Optional)"
                accessibilityLabel="Address Line 2"
                placeholder="Landmark, Area"
                value={addressLine2}
                onChangeText={setAddressLine2}
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                label="City *"
                accessibilityLabel="City"
                placeholder="e.g. Bengaluru"
                value={city}
                onChangeText={setCity}
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                label="State *"
                accessibilityLabel="State"
                placeholder="e.g. Karnataka"
                value={state}
                onChangeText={setState}
                editable={!isSaving}
              />
            </View>

            <View style={styles.inputGroupLast}>
              <TextInput
                label="Pincode *"
                accessibilityLabel="Pincode"
                placeholder="6-digit pincode"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isSaving}
              />
            </View>

            <Pressable
              disabled={!isConnected || isSaving}
              onPress={onSubmit}
              accessibilityLabel="Save Address"
              style={({ pressed }) => [
                styles.submitButton,
                (!isConnected || isSaving) && { opacity: 0.6 },
                pressed && { opacity: 0.9 },
              ]}
            >
              <LinearGradient
                colors={['#14532D', '#1B6A3A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitText}>Save Address</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast'}
        onDismiss={() => setToast(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A202C',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  description: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 20,
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupLast: {
    marginBottom: 24,
  },
  submitButton: {
    borderRadius: 16,
    height: 56,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
