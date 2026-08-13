import React from 'react';
import { View } from 'react-native';
import { Text, formatMoneyInr, useTheme } from 'foodie-shared-rn';
import type { LedgerEntry } from '../types';
import { parseMoneyAmount } from '../types';

type Props = {
  entry: LedgerEntry;
};

/** Ledger row — UI-API LedgerRow. */
export function LedgerRow({ entry }: Props) {
  const { tokens } = useTheme();
  const amount = parseMoneyAmount(entry.amount);
  const credit = entry.entryType === 'CREDIT';
  const signed =
    amount === null
      ? '—'
      : `${credit ? '+' : '-'}${formatMoneyInr(Math.abs(amount))}`;

  return (
    <View style={styles.cardContainer} accessibilityLabel={`${entry.entryType} ${signed}`}>
      <View style={styles.leftContent}>
        <View style={[styles.iconCircle, credit ? styles.iconCredit : styles.iconDebit]}>
          <Feather
            name={credit ? 'arrow-down-left' : 'arrow-up-right'}
            size={18}
            color={credit ? '#14532D' : '#1A202C'}
          />
        </View>
        <View style={styles.textStack}>
          <Text style={styles.typeText}>{entry.referenceType}</Text>
          <Text style={styles.dateText}>
            {entry.createdAt ? new Date(entry.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
          </Text>
        </View>
      </View>
      <View style={styles.rightContent}>
        <Text style={[styles.amountText, credit ? styles.amountCredit : styles.amountDebit]}>
          {signed}
        </Text>
        <Text style={styles.statusBadge}>{entry.entryType}</Text>
      </View>
    </View>
  );
}

import { StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCredit: {
    backgroundColor: 'rgba(20, 83, 45, 0.1)',
  },
  iconDebit: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textStack: {
    flex: 1,
  },
  typeText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 12,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  amountCredit: {
    color: '#14532D',
  },
  amountDebit: {
    color: '#1A202C',
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#718096',
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    letterSpacing: 0.5,
  }
});
