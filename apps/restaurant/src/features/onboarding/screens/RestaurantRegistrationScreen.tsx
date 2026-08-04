import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useRegisterRestaurantMutation } from '../../../api/endpoints/restaurantsApi';
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

type Props = NativeStackScreenProps<
  OnboardingStackParamList,
  'RestaurantRegistration'
>;

/**
 * P2-RES-01 — POST /restaurants. MapPicker residual: lat/lng text fields.
 */
export function RestaurantRegistrationScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const [register, registerState] = useRegisterRestaurantMutation();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
      handleError(toUnwrappedApiError(error));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.sm,
          paddingBottom: 48,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="heading1" accessibilityRole="header">
          Register restaurant
        </Text>
        <OnboardingStepper activeIndex={0} />
        <Text variant="body" color={tokens.color.textSecondary}>
          Create your restaurant profile. Approval is required before orders.
        </Text>

        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          accessibilityLabel="Restaurant name"
        />
        <TextInput
          label="Description (optional)"
          value={description}
          onChangeText={setDescription}
          accessibilityLabel="Restaurant description"
          multiline
        />

        <Text variant="label">Cuisine types</Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: tokens.spacing.xs,
          }}
        >
          {CUISINE_TYPES.map((cuisine) => {
            const selected = cuisineTypes.includes(cuisine);
            return (
              <Pressable
                key={cuisine}
                onPress={() => toggleCuisine(cuisine)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={cuisine.replace(/_/g, ' ')}
                style={{
                  paddingHorizontal: tokens.spacing.sm,
                  paddingVertical: tokens.spacing.xs,
                  borderRadius: tokens.radius.sm,
                  borderWidth: 1,
                  borderColor: tokens.color.border,
                  backgroundColor: selected
                    ? tokens.color.accent
                    : tokens.color.surface,
                }}
              >
                <Text
                  variant="caption"
                  color={
                    selected
                      ? tokens.color.textInverse
                      : tokens.color.textPrimary
                  }
                >
                  {cuisine.replace(/_/g, ' ')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          label="Address line 1"
          value={line1}
          onChangeText={setLine1}
          accessibilityLabel="Address line 1"
        />
        <TextInput
          label="Address line 2 (optional)"
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
          Map picker lands in a later module — enter coordinates for now.
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

        <Button
          label="Create restaurant"
          accessibilityLabel="Create restaurant"
          loading={registerState.isLoading}
          onPress={() => {
            void onSubmit();
          }}
        />
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
