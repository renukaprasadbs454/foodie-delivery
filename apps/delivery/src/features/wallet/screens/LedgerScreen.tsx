import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EmptyState,
  Text,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { LedgerRow } from '../components/LedgerRow';
import { LedgerSkeleton } from '../components/LedgerSkeleton';
import { useWalletLedgerFeed } from '../hooks/useWalletLedgerFeed';
import type { LedgerSort } from '../types';
import type { MainStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Ledger'>;

const SORT_OPTIONS: { value: LedgerSort; label: string }[] = [
  { value: 'createdAt', label: 'Newest' },
  { value: '-createdAt', label: 'Oldest first (-createdAt)' },
  { value: '+createdAt', label: 'Oldest first (+createdAt)' },
];

/**
 * P2-DEL-04 — GET /wallet/ledger (paginated; INR 2dp).
 */
export function LedgerScreen(_props: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const [sort, setSort] = useState<LedgerSort>('createdAt');
  const feed = useWalletLedgerFeed({ sort });

  useEffect(() => {
    trackAnalyticsEvent('delivery_ledger_viewed');
    trackAnalyticsEvent('wallet_ledger_viewed');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topArch, { height: 160 }]} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ledger</Text>
        <Text style={styles.headerSubtitle}>View all your transaction history</Text>
      </View>

      {!isConnected && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Offline — showing cached ledger pages.
          </Text>
        </View>
      )}

      <FlatList
        data={feed.items}
        keyExtractor={(item) => item.ledgerEntryId}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={feed.isFetching && feed.items.length > 0}
            onRefresh={() => {
              void feed.refetch();
            }}
            tintColor="#FFF"
            colors={['#F59E0B']}
          />
        }
        ListHeaderComponent={
          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort By</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortChips}>
              {SORT_OPTIONS.map((option) => {
                const selected = sort === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setSort(option.value);
                      trackAnalyticsEvent('filter_changed', { sort: option.value });
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                    style={[styles.sortChip, selected && styles.sortChipActive]}
                  >
                    <Text style={[styles.sortChipText, selected && styles.sortChipTextActive]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          feed.isLoading ? (
            <LedgerSkeleton />
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name={feed.isError ? 'alert-triangle' : 'file-text'} size={32} color="#A0AEC0" />
              </View>
              <Text style={styles.emptyTitle}>
                {feed.isError ? 'Load Failed' : 'No Transactions'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {feed.isError
                  ? 'Could not load ledger. Pull to retry.'
                  : 'Credits and debits will appear here after deliveries.'}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          feed.hasMore ? (
            <Pressable
              onPress={feed.onLoadMore}
              accessibilityRole="button"
              accessibilityLabel="Load more ledger entries"
              style={styles.loadMoreButton}
            >
              <Text style={styles.loadMoreText}>
                {feed.isFetching ? 'Loading...' : 'Load older entries'}
              </Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => <LedgerRow entry={item} />}
      />
    </SafeAreaView>
  );
}

import { StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  topArch: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: '#14532D',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  warningContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  warningText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sortContainer: {
    marginBottom: 24,
  },
  sortLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 12,
  },
  sortChips: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 32,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortChipActive: {
    backgroundColor: '#14532D',
    borderColor: '#14532D',
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#718096',
  },
  sortChipTextActive: {
    color: '#FFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 4,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadMoreButton: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
  },
});
