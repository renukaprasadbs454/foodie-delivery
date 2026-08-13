import React from 'react';
import { View } from 'react-native';
import { Button, Text, useTheme } from 'foodie-shared-rn';
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
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Payout</Text>
          <Text style={styles.priceAmount}>₹120</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottomRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Distance</Text>
          <Text style={styles.statValue}>{formatDistanceKm(offer.estimatedDistance)}</Text>
        </View>
        <View style={styles.buttonRow}>
          {onReject && (
            <Button
              label="Reject"
              accessibilityLabel={`Reject offer from ${offer.restaurantName}`}
              disabled={acceptDisabled || accepting}
              onPress={onReject}
              variant="secondary"
              style={[styles.acceptButtonOverride, { backgroundColor: 'transparent', borderColor: '#E2E8F0', borderWidth: 1, marginRight: 8, elevation: 0, shadowOpacity: 0 }]}
            />
          )}
          <Button
            label={accepting ? '...' : 'Accept'}
            accessibilityLabel={`Accept offer from ${offer.restaurantName}`}
            loading={accepting}
            disabled={acceptDisabled}
            onPress={onAccept}
            variant="primary"
            style={styles.acceptButtonOverride}
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
    marginBottom: 16,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconSpaced: {
    marginRight: 16,
  },
  restaurantIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  restaurantIconText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F59E0B',
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
  },
  priceContainer: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceLabel: {
    fontSize: 11,
    color: '#A0AEC0',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#14532D',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF2F7',
    marginBottom: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#A0AEC0',
    fontWeight: '600',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A202C',
  },
  acceptButtonOverride: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  acceptButtonTextOverride: {
    fontSize: 15,
    fontWeight: '800',
  }
});
