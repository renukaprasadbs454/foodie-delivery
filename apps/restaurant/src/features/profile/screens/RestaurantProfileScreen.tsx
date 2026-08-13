import React, { useEffect, useState } from 'react';
import {
  Image,
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
  Card,
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
  useGetRestaurantProfileQuery,
  useGetRestaurantQuery,
  useUpdateRestaurantProfileMutation,
} from '../../../api/endpoints/restaurantsApi';
import { useUploadProfileImageMutation } from '../../../api/endpoints/usersApi';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectRestaurantId,
  setRestaurantCreated,
} from '../../onboarding/restaurantOnboardingSlice';
import {
  CUISINE_TYPES,
  type CuisineType,
} from '../../onboarding/types';
import { toUnwrappedApiError } from '../../auth/apiError';
import { RestaurantProfileSkeleton } from '../components/RestaurantProfileSkeleton';
import { validateProfileForm } from '../types';
import type { ProfileStackParamList } from '../../../navigation/types';
import { DemoModeIndicator } from '../../../components/DemoModeIndicator';
import { MOCK_CONFIG } from '../../../config/mockConfig';
import { getMockRestaurantProfile, type MockRestaurantProfile } from '../../../mock';

type Props = NativeStackScreenProps<ProfileStackParamList, 'RestaurantProfile'>;

const BRAND_PRIMARY = '#14532D'; // Dark Green
const BRAND_ACCENT = '#F59E0B';  // Gold
const COVER_IMAGE_URL = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80';

export function RestaurantProfileScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();
  const storedRestaurantId = useAppSelector(selectRestaurantId);

  const profileQuery = useGetRestaurantProfileQuery(undefined, {
    skip: Boolean(storedRestaurantId),
  });

  useEffect(() => {
    if (profileQuery.data?.restaurantId && !storedRestaurantId) {
      dispatch(
        setRestaurantCreated({
          restaurantId: profileQuery.data.restaurantId,
          status: profileQuery.data.status ?? 'APPROVED',
        }),
      );
    }
  }, [dispatch, profileQuery.data, storedRestaurantId]);

  const restaurantId =
    storedRestaurantId ??
    profileQuery.data?.restaurantId ??
    (MOCK_CONFIG.ENABLE_MOCK_FALLBACK ? MOCK_CONFIG.DEFAULT_MOCK_RESTAURANT_ID : undefined);

  const mockProfile = getMockRestaurantProfile();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisineTypes, setCuisineTypes] = useState<CuisineType[]>([]);
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
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
  const [uploadImage] = useUploadProfileImageMutation();

  const apiProfile = query.data;
  const isUsingMock =
    MOCK_CONFIG.ENABLE_MOCK_FALLBACK &&
    (!isConnected || query.isError || !apiProfile);

  const profileData = (apiProfile ?? (isUsingMock ? mockProfile : undefined)) as MockRestaurantProfile | undefined;

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
    if (!profileData || hydrated) return;
    setName(profileData.name ?? '');
    setDescription(profileData.description ?? '');
    setCuisineTypes(
      (profileData.cuisineTypes ?? []).filter((c): c is CuisineType =>
        (CUISINE_TYPES as readonly string[]).includes(c),
      ),
    );
    setLine1(profileData.address?.line1 ?? '');
    setLine2(profileData.address?.line2 ?? '');
    setCity(profileData.address?.city ?? '');
    setPincode(profileData.address?.pincode ?? '');
    setLatitude(
      profileData.address?.latitude != null ? String(profileData.address.latitude) : '',
    );
    setLongitude(
      profileData.address?.longitude != null ? String(profileData.address.longitude) : '',
    );
    setPhone((profileData as MockRestaurantProfile).phone ?? '+91 98765 43210');
    setEmail((profileData as MockRestaurantProfile).email ?? 'contact@foodierestaurant.com');
    setOpeningTime((profileData as MockRestaurantProfile).openingTime ?? '11:00 AM');
    setClosingTime((profileData as MockRestaurantProfile).closingTime ?? '11:00 PM');
    setAvatarUri(profileData.logoImageUrl ?? null);
    setHydrated(true);
  }, [profileData, hydrated]);

  useEffect(() => {
    if (!query.data && !isUsingMock) setHydrated(false);
  }, [restaurantId, query.data, isUsingMock]);

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

    if (isUsingMock) {
      setToast({ message: 'Profile saved in Demo Mode.', variant: 'success' });
      return;
    }

    try {
      await updateProfile(validated.value).unwrap();
      setToast({ message: 'Profile saved successfully.', variant: 'success' });
      setHydrated(false);
      void query.refetch();
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  const onPickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setToast({ message: 'Gallery permission denied.', variant: 'warning' });
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

    if (isUsingMock) {
      setAvatarUri(asset.uri);
      setToast({ message: 'Logo updated in Demo Mode.', variant: 'success' });
      return;
    }

    const mimeType = asset.mimeType ?? 'image/jpeg';
    try {
      await uploadImage({
        uri: asset.uri,
        mimeType,
        fileName: asset.fileName ?? 'profile.jpg',
      }).unwrap();
      setAvatarUri(asset.uri);
      setToast({ message: 'Photo uploaded successfully.', variant: 'success' });
    } catch (error) {
      handleError(toUnwrappedApiError(error));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 80,
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
        {/* DEMO MODE INDICATOR */}
        {isUsingMock ? <DemoModeIndicator isMockActive={true} /> : null}

        {query.isLoading && !profileData ? (
          <RestaurantProfileSkeleton />
        ) : (
          <>
            {/* HERO COVER BANNER & LOGO OVERLAY */}
            <Card style={{ padding: 0, overflow: 'hidden', borderRadius: 16 }}>
              <View style={{ position: 'relative', height: 160 }}>
                <Image
                  source={{ uri: profileData?.coverImageUrl ?? COVER_IMAGE_URL }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(20, 83, 45, 0.35)',
                  }}
                />
              </View>

              <View
                style={{
                  padding: tokens.spacing.lg,
                  gap: tokens.spacing.sm,
                  marginTop: -40,
                  alignItems: 'center',
                }}
              >
                <View style={{ position: 'relative' }}>
                  <Avatar
                    uri={avatarUri}
                    initials={(name || 'R').slice(0, 2).toUpperCase()}
                    size={88}
                    accessibilityLabel="Restaurant avatar"
                  />
                  <Pressable
                    onPress={() => void onPickPhoto()}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: -4,
                      backgroundColor: BRAND_ACCENT,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: '#FFFFFF',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Change logo"
                  >
                    <Text variant="caption" style={{ color: '#000000', fontWeight: 'bold', fontSize: 11 }}>
                      📷 Edit
                    </Text>
                  </Pressable>
                </View>

                <View style={{ alignItems: 'center', gap: 4 }}>
                  <Text variant="heading1" style={{ color: BRAND_PRIMARY, textAlign: 'center', fontWeight: 'bold' }}>
                    {name || 'Restaurant Profile'}
                  </Text>

                  {/* Rating & Status */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm }}>
                    <View
                      style={{
                        backgroundColor: '#FEF3C7',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Text style={{ color: BRAND_ACCENT, fontSize: 14 }}>★</Text>
                      <Text variant="label" style={{ color: '#92400E', fontWeight: 'bold' }}>
                        {profileData?.avgRating ? String(profileData.avgRating) : '4.8'} (124 reviews)
                      </Text>
                    </View>

                    <View
                      style={{
                        backgroundColor: '#DCFCE7',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}
                    >
                      <Text variant="caption" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
                        ● {profileData?.status ?? 'APPROVED'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Card>

            {/* BRANDING & CONTACT DETAILS CARD */}
            <Card style={{ padding: tokens.spacing.md, gap: tokens.spacing.sm, borderRadius: 14 }}>
              <Text variant="heading2" style={{ color: BRAND_PRIMARY, fontSize: 17 }}>
                Basic & Contact Information
              </Text>
              <View style={{ height: 1, backgroundColor: tokens.color.border }} />

              <TextInput
                label="Restaurant Name *"
                value={name}
                onChangeText={setName}
                accessibilityLabel="Restaurant name"
              />

              <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Phone Number"
                    value={phone}
                    onChangeText={setPhone}
                    accessibilityLabel="Phone Number"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    accessibilityLabel="Email Address"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              <TextInput
                label="About Restaurant & Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Share your culinary story, specialties & dining atmosphere"
                accessibilityLabel="Description"
                multiline
              />

              {/* Operating Hours */}
              <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Opening Time"
                    value={openingTime}
                    onChangeText={setOpeningTime}
                    accessibilityLabel="Opening Time"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Closing Time"
                    value={closingTime}
                    onChangeText={setClosingTime}
                    accessibilityLabel="Closing Time"
                  />
                </View>
              </View>

              {/* Cuisine Types */}
              <View style={{ gap: tokens.spacing.xs, marginTop: 4 }}>
                <Text variant="label">Cuisine Types</Text>
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
                          borderRadius: tokens.radius.full,
                          borderWidth: 1,
                          borderColor: selected ? BRAND_PRIMARY : tokens.color.border,
                          backgroundColor: selected ? BRAND_PRIMARY : tokens.color.surface,
                        }}
                      >
                        <Text
                          variant="caption"
                          color={selected ? '#FFFFFF' : tokens.color.textPrimary}
                          style={{ fontWeight: selected ? 'bold' : 'normal' }}
                        >
                          {cuisine.replace(/_/g, ' ')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </Card>

            {/* LOCATION & ADDRESS CARD */}
            <Card style={{ padding: tokens.spacing.md, gap: tokens.spacing.sm, borderRadius: 14 }}>
              <Text variant="heading2" style={{ color: BRAND_PRIMARY, fontSize: 17 }}>
                Location & Delivery Address
              </Text>
              <View style={{ height: 1, backgroundColor: tokens.color.border }} />

              <TextInput
                label="Address Line 1 *"
                value={line1}
                onChangeText={setLine1}
                placeholder="Street name, building #"
                accessibilityLabel="Address line 1"
              />
              <TextInput
                label="Address Line 2"
                value={line2}
                onChangeText={setLine2}
                placeholder="Landmark or locality"
                accessibilityLabel="Address line 2"
              />
              <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="City *"
                    value={city}
                    onChangeText={setCity}
                    accessibilityLabel="City"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Pincode *"
                    value={pincode}
                    onChangeText={setPincode}
                    accessibilityLabel="Pincode"
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Latitude"
                    value={latitude}
                    onChangeText={setLatitude}
                    accessibilityLabel="Latitude"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Longitude"
                    value={longitude}
                    onChangeText={setLongitude}
                    accessibilityLabel="Longitude"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </Card>

            {/* RESTAURANT LOCATION CARD */}
            <Card style={{ padding: tokens.spacing.md, gap: tokens.spacing.sm, borderRadius: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Text style={{ fontSize: 22 }}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text variant="heading2" style={{ color: BRAND_PRIMARY, fontSize: 16, fontWeight: '700' }}>
                      Restaurant Location
                    </Text>
                    <Text variant="caption" style={{ color: '#64748B', fontSize: 13 }}>
                      {city ? `${line2 ? line2 + ', ' : ''}${city}` : 'Koramangala, Bengaluru'}
                    </Text>
                  </View>
                </View>
                <Button
                  label="View / Edit"
                  accessibilityLabel="View or Edit Location"
                  variant="secondary"
                  style={{ borderColor: BRAND_ACCENT }}
                  onPress={() => navigation.navigate('RestaurantLocation')}
                />
              </View>
            </Card>

            {/* QUICK ACTIONS & DOCUMENTS CARD */}
            <Card style={{ padding: tokens.spacing.md, gap: tokens.spacing.sm, borderRadius: 14 }}>
              <Text variant="heading2" style={{ color: BRAND_PRIMARY, fontSize: 17 }}>
                Legal Verification & Gallery
              </Text>
              <View style={{ height: 1, backgroundColor: tokens.color.border }} />

              <View style={{ flexDirection: 'row', gap: tokens.spacing.xs, flexWrap: 'wrap' }}>
                <Button
                  label="🏦 Bank & Business"
                  accessibilityLabel="Open Bank and Business Details"
                  variant="secondary"
                  style={{ borderColor: BRAND_ACCENT }}
                  onPress={() => navigation.navigate('BankAndBusinessDetails')}
                />
                <Button
                  label="📄 Documents"
                  accessibilityLabel="Open documents"
                  variant="secondary"
                  onPress={() => navigation.navigate('RestaurantDocuments')}
                />
                <Button
                  label="🖼️ Gallery"
                  accessibilityLabel="Open images"
                  variant="secondary"
                  onPress={() => navigation.navigate('RestaurantImages')}
                />
                <Button
                  label="⚙️ Settings"
                  accessibilityLabel="Open settings"
                  variant="secondary"
                  onPress={() => navigation.navigate('RestaurantSettings')}
                />
              </View>
            </Card>

            {/* SAVE BUTTON */}
            <Button
              label="Save Restaurant Profile"
              accessibilityLabel="Save profile"
              loading={updateState.isLoading}
              style={{ backgroundColor: BRAND_PRIMARY, height: 48 }}
              onPress={() => {
                void onSave();
              }}
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
