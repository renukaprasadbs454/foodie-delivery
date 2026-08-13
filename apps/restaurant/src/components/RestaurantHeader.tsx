import React, { useState } from 'react';
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';
import { useAppSelector } from '../store/hooks';
import { selectRestaurantId } from '../features/onboarding/restaurantOnboardingSlice';

type Props = {
  title?: string;
  subtitle?: string;
  navigation?: any;
  showBack?: boolean;
};

const BRAND_PRIMARY = '#14532D'; // Dark Green
const BRAND_ACCENT = '#F59E0B';  // Amber / Gold

export function RestaurantHeader({
  title = 'Foodie Partner',
  subtitle,
  navigation,
  showBack = false,
}: Props) {
  const { tokens } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const restaurantId = useAppSelector(selectRestaurantId);
  const [isOnline, setIsOnline] = useState<boolean>(true);

  const displayTitle: string = title;
  const displaySubtitle: string =
    subtitle ?? (restaurantId ? `Restaurant #${restaurantId.slice(0, 8)}` : 'Restaurant Partner Portal');

  const canGoBack = showBack || (navigation && typeof navigation.canGoBack === 'function' && navigation.canGoBack());

  const handleProfilePress = () => {
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('ProfileTab');
    }
  };

  const handleNotificationPress = () => {
    if (navigation && typeof navigation.navigate === 'function') {
      navigation.navigate('NotificationsHome');
    }
  };

  return (
    <View style={{ backgroundColor: BRAND_PRIMARY, zIndex: 100 }}>
      <View
        style={{
          height: isWide ? 64 : 58,
          paddingHorizontal: tokens.spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: isWide ? 1200 : undefined,
          alignSelf: isWide ? 'center' : undefined,
          width: '100%',
        }}
      >
        {/* LEFT BRAND & TITLE AREA */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          {canGoBack ? (
            <Pressable
              onPress={() => navigation?.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={({ pressed }) => [{
                padding: 6,
                borderRadius: 8,
                backgroundColor: pressed ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
              }]}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>
                ←
              </Text>
            </Pressable>
          ) : null}

          {/* LOGO ICON WITH AMBER ACCENT RING */}
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#1E6B39',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: BRAND_ACCENT,
            }}
          >
            <Text style={{ fontSize: 20 }}>🍳</Text>
          </View>

          {/* TITLE & SUBTITLE */}
          <View style={{ gap: 1, flex: 1 }}>
            <Text
              variant="label"
              style={{
                color: '#FFFFFF',
                fontSize: isWide ? 17 : 15,
                fontWeight: 'bold',
              }}
              numberOfLines={1}
            >
              {displayTitle}
            </Text>

            <Text
              variant="caption"
              style={{
                color: '#A7F3D0',
                fontSize: 11,
              }}
              numberOfLines={1}
            >
              {displaySubtitle}
            </Text>
          </View>
        </View>

        {/* RIGHT ACTION CONTROLS: ONLINE STATUS, BELL & PROFILE AVATAR */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm }}>
          {/* ONLINE / OFFLINE TOGGLE PILL */}
          <Pressable
            onPress={() => setIsOnline((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel={`Restaurant status ${isOnline ? 'Online' : 'Offline'}`}
            style={({ pressed }) => [{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              gap: 6,
              backgroundColor: isOnline ? '#064E3B' : '#7F1D1D',
              borderWidth: 1,
              borderColor: isOnline ? '#059669' : '#DC2626',
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: isOnline ? '#22C55E' : '#EF4444',
              }}
            />
            <Text
              variant="caption"
              style={{
                color: isOnline ? '#6EE7B7' : '#FCA5A5',
                fontWeight: 'bold',
                fontSize: 11,
              }}
            >
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </Pressable>

          {/* NOTIFICATION BELL ICON WITH AMBER DOT */}
          <Pressable
            onPress={handleNotificationPress}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={({ pressed }) => [{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: pressed ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }]}
          >
            <Text style={{ fontSize: 17 }}>🔔</Text>
            <View
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: BRAND_ACCENT,
                borderWidth: 1.5,
                borderColor: BRAND_PRIMARY,
              }}
            />
          </Pressable>

          {/* PROFILE AVATAR CIRCLE */}
          <Pressable
            onPress={handleProfilePress}
            accessibilityRole="button"
            accessibilityLabel="Restaurant Profile"
            style={({ pressed }) => [{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#DCFCE7',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: BRAND_ACCENT,
              opacity: pressed ? 0.8 : 1,
            }]}
          >
            <Text style={{ fontSize: 16 }}>👤</Text>
          </Pressable>
        </View>
      </View>

      {/* SUBTLE AMBER BOTTOM ACCENT LINE */}
      <View style={{ height: 2, backgroundColor: BRAND_ACCENT }} />
    </View>
  );
}
