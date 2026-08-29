import React from 'react';
import { View } from 'react-native';
import { Button, Text, useTheme } from 'foodie-shared-rn';
import { Feather, Ionicons } from '@expo/vector-icons';
import type { DeliveryOffer } from '../types';
import { formatDistanceKm } from '../types';

type Props = {
  offer: DeliveryOffer;
  accepting: boolean;
  acceptDisabled: boolean;
  onAccept: () => void;
  onReject?: () => void;
};

/** Offer row — UI-API OfferCard. Accept only (no decline — GAP-API-10). */
export function OfferCard({
  offer,
  accepting,
  acceptDisabled,
  onAccept,
  onReject
}: Props) {
  const { tokens } = useTheme();
  return (
    <View
      style={styles.cardContainer}
      accessibilityLabel={`Offer from ${offer.restaurantName}`}
    >
      <View style={styles.topRow}>
        <View style={styles.iconSpaced}>
          <View style={styles.restaurantIconCircle}>
            <Text style={styles.restaurantIconText}>{offer.restaurantName.charAt(0)}</Text>
          </View>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.restaurantTitle} numberOfLines={1}>{offer.restaurantName}</Text>
          <Text style={styles.addressSubtitle} numberOfLines={2}>{offer.pickupAddress}</Text>
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate-circle" size={14} color="#14532D" />
            <Text style={styles.distanceText}>{formatDistanceKm(offer.estimatedDistance)} away</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Earn</Text>
          <Text style={styles.priceAmount}>₹120</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.buttonRow}>
          {onReject && (
            <Button
              label="Decline"
              accessibilityLabel={`Reject offer from ${offer.restaurantName}`}
              disabled={acceptDisabled || accepting}
              onPress={onReject}
              variant="secondary"
              style={[styles.rejectButton, { flex: 1, marginRight: 12 }]}
            />
          )}
          <Button
            label={accepting ? 'Accepting...' : 'Accept Delivery'}
            accessibilityLabel={`Accept offer from ${offer.restaurantName}`}
            loading={accepting}
            disabled={acceptDisabled}
            onPress={onAccept}
            variant="primary"
            style={[styles.acceptButton, { flex: onReject ? 2 : 1 }]}
          />
        </View>
      </View>
    </View>
  );
}

import { StyleSheet } from 'react-native';
const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconSpaced: {
    marginRight: 16,
  },
  restaurantIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  restaurantIconText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#EF4444',
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  restaurantTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 4,
  },
  addressSubtitle: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
    marginBottom: 8,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14532D',
    marginLeft: 4,
  },
  priceContainer: {
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  priceLabel: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  priceAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#14532D',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF2F7',
    marginBottom: 16,
  },
  bottomRow: {
    flexDirection: 'column',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  rejectButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#14532D',
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
