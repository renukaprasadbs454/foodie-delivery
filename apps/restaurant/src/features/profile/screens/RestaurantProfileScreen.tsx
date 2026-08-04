import React, { useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import {
  Avatar,
  Button,
  EmptyState,
  IMAGE_ALLOWED_MIME_TYPES,
  isImageWithinSizeLimit,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import {
  useGetRestaurantQuery,
  useUpdateRestaurantProfileMutation,
} from '../../../api/endpoints/restaurantsApi';
import { useUploadProfileImageMutation } from '../../../api/endpoints/usersApi';
import { useAppSelector } from '../../../store/hooks';
import { selectRestaurantId } from '../../onboarding/restaurantOnboardingSlice';
import {
  CUISINE_TYPES,
  type CuisineType,
} from '../../onboarding/types';
import { toUnwrappedApiError } from '../../auth/apiError';
import { RestaurantProfileSkeleton } from '../components/RestaurantProfileSkeleton';
import { validateProfileForm } from '../types';
import type { ProfileStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'RestaurantProfile'>;

/**
 * P2-RES-04 Restaurant Profile — GET by persisted id + PUT /restaurants/me.
 * status/commissionPct read-only. GAP-API-03 Gap shell without id.
 */
export function RestaurantProfileScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const restaurantId = useAppSelector(selectRestaurantId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisineTypes, setCuisineTypes] = useState<CuisineType[]>([]);
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const query = useGetRestaurantQuery(restaurantId ?? '', {
    skip: !restaurantId,
    refetchOnFocus: true,
  });
  const [updateProfile, updateState] = useUpdateRestaurantProfileMutation();
  const [uploadImage, uploadState] = useUploadProfileImageMutation();

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
    trackAnalyticsEvent('restaurant_profile_viewed');
  }, []);

  useEffect(() => {
    const data = query.data;
    if (!data || hydrated) return;
    setName(data.name ?? '');
    setDescription(data.description ?? '');
    setCuisineTypes(
      (data.cuisineTypes ?? []).filter((c): c is CuisineType =>
        (CUISINE_TYPES as readonly string[]).includes(c),
      ),
    );
    setLine1(data.address?.line1 ?? '');
    setLine2(data.address?.line2 ?? '');
    setCity(data.address?.city ?? '');
    setPincode(data.address?.pincode ?? '');
    setLatitude(
      data.address?.latitude != null ? String(data.address.latitude) : '',
    );
    setLongitude(
      data.address?.longitude != null ? String(data.address.longitude) : '',
    );
    setAvatarUri(data.logoImageUrl ?? null);
    setHydrated(true);
  }, [query.data, hydrated]);

  useEffect(() => {
    if (!query.data) setHydrated(false);
  }, [restaurantId, query.data]);

  const toggleCuisine = (cuisine: CuisineType) => {
    setCuisineTypes((prev) =>
      prev.includes(cuisine)
        ? prev.filter((c) => c !== cuisine)
        : [...prev, cuisine],
    );
  };

  const onSave = async () => {
    const validated = validateProfileForm({
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
        message: 'Connect to the internet to save your profile.',
        variant: 'warning',
      });
      return;
    }
    try {
      await updateProfile(validated.value).unwrap();
      trackAnalyticsEvent('profile_saved');
      trackAnalyticsEvent('restaurant_profile_updated');
      setToast({ message: 'Profile saved.', variant: 'success' });
      setHydrated(false);
      void query.refetch();
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  const onPickPhoto = async () => {
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to upload a photo.',
        variant: 'warning',
      });
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setToast({
        message: 'Gallery permission denied.',
        variant: 'warning',
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    if (!(IMAGE_ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType)) {
      setToast({
        message: 'Use a JPEG, PNG, or WebP image.',
        variant: 'error',
      });
      return;
    }
    if (
      typeof asset.fileSize === 'number' &&
      !isImageWithinSizeLimit(asset.fileSize)
    ) {
      setToast({
        message: 'Image must be 5 MB or smaller.',
        variant: 'error',
      });
      return;
    }
    try {
      await uploadImage({
        uri: asset.uri,
        mimeType,
        fileName: asset.fileName ?? 'profile.jpg',
      }).unwrap();
      setAvatarUri(asset.uri);
      setToast({ message: 'Photo uploaded.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  if (!restaurantId) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.color.background,
          padding: tokens.spacing.xl,
          justifyContent: 'center',
        }}
      >
        <EmptyState
          title="Restaurant id unavailable"
          description="Cold start without a stored restaurant id cannot load profile. GET /restaurants/me is an API gap (GAP-API-03)."
          accessibilityLabel="Restaurant id gap"
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.sm,
          paddingBottom: 48,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching}
            onRefresh={() => {
              setHydrated(false);
              void query.refetch();
            }}
          />
        }
      >
        <Text variant="heading1" accessibilityRole="header">
          Profile
        </Text>
        {!isConnected ? (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — showing cached profile; save blocked.
          </Text>
        ) : null}

        {query.isLoading && !query.data ? (
          <RestaurantProfileSkeleton />
        ) : (
          <>
            <View style={{ alignItems: 'center', gap: tokens.spacing.sm }}>
              <Avatar
                uri={avatarUri}
                initials={(name || 'R').slice(0, 2).toUpperCase()}
                size={72}
                accessibilityLabel="Restaurant avatar"
              />
              <Button
                label="Upload photo"
                accessibilityLabel="Upload profile photo"
                variant="secondary"
                loading={uploadState.isLoading}
                onPress={() => {
                  void onPickPhoto();
                }}
              />
            </View>

            {query.data?.status ? (
              <Text variant="caption" color={tokens.color.textSecondary}>
                Status: {query.data.status} (read-only)
              </Text>
            ) : null}
            {query.data?.commissionPct != null ? (
              <Text variant="caption" color={tokens.color.textSecondary}>
                Commission: {String(query.data.commissionPct)}% (read-only)
              </Text>
            ) : null}

            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              accessibilityLabel="Restaurant name"
            />
            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              accessibilityLabel="Description"
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
              label="Address line 2"
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
              label="Save profile"
              accessibilityLabel="Save profile"
              loading={updateState.isLoading}
              onPress={() => {
                void onSave();
              }}
            />
            <Button
              label="Documents"
              accessibilityLabel="Open documents"
              variant="secondary"
              onPress={() => navigation.navigate('RestaurantDocuments')}
            />
            <Button
              label="Images"
              accessibilityLabel="Open images"
              variant="secondary"
              onPress={() => navigation.navigate('RestaurantImages')}
            />
            <Button
              label="Settings"
              accessibilityLabel="Open settings"
              variant="secondary"
              onPress={() => navigation.navigate('RestaurantSettings')}
            />
          </>
        )}
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
