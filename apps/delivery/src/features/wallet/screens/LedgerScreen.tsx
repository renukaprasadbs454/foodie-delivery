import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
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
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <FlatList
        data={feed.items}
        keyExtractor={(item) => item.ledgerEntryId}
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 48,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={feed.isFetching && feed.items.length > 0}
            onRefresh={() => {
              void feed.refetch();
            }}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: tokens.spacing.md, marginBottom: tokens.spacing.sm }}>
            <Text variant="heading1" accessibilityRole="header">
              Ledger
            </Text>
            {!isConnected ? (
              <Text variant="caption" color={tokens.color.warning}>
                Offline — showing cached ledger pages.
              </Text>
            ) : null}
            <Text variant="label">Sort</Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: tokens.spacing.sm,
              }}
            >
              {SORT_OPTIONS.map((option) => {
                const selected = sort === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => {
                      setSort(option.value);
                      trackAnalyticsEvent('filter_changed', {
                        sort: option.value,
                      });
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                    style={{
                      paddingHorizontal: tokens.spacing.md,
                      paddingVertical: tokens.spacing.sm,
                      minHeight: 48,
                      justifyContent: 'center',
                      borderRadius: tokens.radius.sm,
                      borderWidth: 1,
                      borderColor: tokens.color.border,
                      backgroundColor: selected
                        ? tokens.color.accent
                        : tokens.color.surface,
                    }}
                  >
                    <Text
                      variant="body"
                      color={
                        selected
                          ? tokens.color.textInverse
                          : tokens.color.textPrimary
                      }
                    >
                      {option.value}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          feed.isLoading ? (
            <LedgerSkeleton />
          ) : (
            <EmptyState
              title="No ledger entries"
              description={
                feed.isError
                  ? 'Could not load ledger. Pull to retry.'
                  : 'Credits and debits will appear here after deliveries and payouts.'
              }
              accessibilityLabel="Empty ledger"
            />
          )
        }
        ListFooterComponent={
          feed.hasMore ? (
            <Pressable
              onPress={feed.onLoadMore}
              accessibilityRole="button"
              accessibilityLabel="Load more ledger entries"
              style={{
                minHeight: 48,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: tokens.spacing.sm,
              }}
            >
              <Text variant="body" color={tokens.color.accent}>
                {feed.isFetching ? 'Loading…' : 'Load more'}
              </Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => <LedgerRow entry={item} />}
      />
    </View>
  );
}
