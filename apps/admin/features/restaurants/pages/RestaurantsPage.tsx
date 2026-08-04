'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  EmptyState,
  Text,
  TextInput,
  trackAnalyticsEvent,
  useTheme,
} from 'foodie-shared-web';
import {
  GAP_API_14_RESTAURANT_LIST,
  RESTAURANT_LIST_GAP_MESSAGE,
} from '@/constants/gaps';
import { isUuid } from '../types';

/**
 * P2-ADM-03 AdminRestaurants — GAP-API-14 Partial shell.
 * No invent list GET. Deep-link by UUID to details.
 */
export function RestaurantsPage() {
  const { tokens } = useTheme();
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    trackAnalyticsEvent('admin_restaurants_viewed', {
      gapId: GAP_API_14_RESTAURANT_LIST,
    });
  }, []);

  const openDetails = () => {
    const id = restaurantId.trim();
    if (!isUuid(id)) {
      setError('Enter a valid restaurant UUID.');
      return;
    }
    setError(undefined);
    router.push(`/restaurants/${id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.lg }}>
      <Text as="h1" variant="heading1">
        Restaurants
      </Text>

      <EmptyState
        title="Restaurant list unavailable"
        description={RESTAURANT_LIST_GAP_MESSAGE}
        aria-label="Restaurant list gap"
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: tokens.spacing.md,
          maxWidth: 480,
          padding: tokens.spacing.md,
          border: `1px solid ${tokens.color.border}`,
          borderRadius: tokens.radius.md,
        }}
      >
        <Text as="h2" variant="heading3">
          Open by UUID
        </Text>
        <Text as="p" variant="caption" color={tokens.color.textSecondary}>
          Deep-link Partial until GAP-API-14 closes. Approve/suspend live on the
          detail screen.
        </Text>
        <TextInput
          label="Restaurant ID"
          name="restaurantId"
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
          errorText={error}
          aria-label="Restaurant UUID"
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        />
        <Button
          label="Open restaurant"
          aria-label="Open restaurant details"
          onClick={openDetails}
        />
      </div>
    </div>
  );
}
