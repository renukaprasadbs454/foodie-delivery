import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EmptyState,
  Text,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useMarkNotificationReadMutation } from '../../../api/endpoints/notificationsApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import type { MainStackParamList } from '../../../navigation/types';
import { NotificationListItem } from '../components/NotificationListItem';
import { NotificationListSkeleton } from '../components/NotificationListSkeleton';
import { useNotificationsFeed } from '../hooks/useNotificationsFeed';
import { useNotificationsSubscription } from '../hooks/useNotificationsSubscription';
import { isNotificationUnread } from '../types';

type Props = NativeStackScreenProps<MainStackParamList, 'DeliveryNotifications'>;

/**
 * P2-DEL-05 Notifications inbox — list + optimistic mark read.
 * Optional user WS while focused. No client send API. Device-token Gap.
 */
export function DeliveryNotificationsScreen(_props: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const feed = useNotificationsFeed(unreadOnly);
  const [markRead] = useMarkNotificationReadMutation();
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  useNotificationsSubscription();

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
    trackAnalyticsEvent('delivery_notifications_viewed');
  }, []);

  const onOpen = async (notificationLogId: string) => {
    const current = feed.items.find(
      (n) => n.notificationLogId === notificationLogId,
    );
    trackAnalyticsEvent('notification_opened', { notificationLogId });
    if (!current || !isNotificationUnread(current)) {
      return;
    }
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to mark as read.',
        variant: 'warning',
      });
      return;
    }

    const snapshot = feed.items;
    const readAt = new Date().toISOString();
    feed.patchLocalRead(notificationLogId, readAt);
    trackAnalyticsEvent('mark_read', { notificationLogId });

    try {
      await markRead(notificationLogId).unwrap();
      trackAnalyticsEvent('notification_read', { notificationLogId });
    } catch (error) {
      feed.rollbackLocal(snapshot);
      handleError(toUnwrappedApiError(error));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative Dark Top Background */}
      <View style={[styles.topArch, { height: 160 }]} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        <Text style={styles.headerSubtitle}>Latest updates and system messages</Text>
      </View>

      {!isConnected ? (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Offline — showing cached inbox when available.
          </Text>
        </View>
      ) : null}

      <View style={styles.segmentedControl}>
        {(
          [
            { label: 'All', value: false },
            { label: 'Unread', value: true },
          ] as const
        ).map((option) => {
          const active = unreadOnly === option.value;
          return (
            <Pressable
              key={option.label}
              onPress={() => setUnreadOnly(option.value)}
              accessibilityRole="button"
              accessibilityLabel={`Show ${option.label.toLowerCase()} notifications`}
              style={[styles.segmentButton, active && styles.segmentButtonActive]}
            >
              <Text
                style={[styles.segmentText, active && styles.segmentTextActive]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {feed.isLoading ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}><NotificationListSkeleton /></View>
      ) : (
        <FlatList
          data={feed.items}
          keyExtractor={(item) => item.notificationLogId}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={feed.isFetching && feed.items.length > 0}
              onRefresh={() => {
                void feed.refetch();
              }}
              tintColor="#F59E0B"
              colors={['#F59E0B']}
            />
          }
          onEndReached={() => feed.onLoadMore()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name={unreadOnly ? 'check-circle' : 'bell-off'} size={32} color="#A0AEC0" />
              </View>
              <Text style={styles.emptyTitle}>
                {unreadOnly ? 'No unread alerts' : 'You are all caught up'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {unreadOnly
                  ? 'Switch to All to see earlier messages.'
                  : 'Offers and payout updates will show up here.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotificationListItem
              notification={item}
              onPress={() => {
                void onOpen(item.notificationLogId);
              }}
            />
          )}
        />
      )}

      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast'}
        onDismiss={() => setToast(null)}
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
    marginBottom: 20,
  },
  warningText: {
    color: '#B91C1C',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  segmentButtonActive: {
    backgroundColor: '#FFF',
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  segmentTextActive: {
    color: '#1A202C',
    fontWeight: '700',
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
    marginTop: 16,
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
});
