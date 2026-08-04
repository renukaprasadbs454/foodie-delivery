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
import type { NotificationsStackParamList } from '../../../navigation/types';
import { NotificationListItem } from '../components/NotificationListItem';
import { NotificationListSkeleton } from '../components/NotificationListSkeleton';
import { useNotificationsFeed } from '../hooks/useNotificationsFeed';
import { useNotificationsSubscription } from '../hooks/useNotificationsSubscription';
import { isNotificationUnread } from '../types';

type Props = NativeStackScreenProps<NotificationsStackParamList, 'Notifications'>;

/**
 * P2-CUS-09 Notifications inbox — list + optimistic mark read.
 * Optional user WS while focused. No client send API. Device-token Gap.
 */
export function NotificationsScreen(_props: Props) {
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
    trackAnalyticsEvent('customer_notifications_viewed');
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
    <View
      style={{
        flex: 1,
        backgroundColor: tokens.color.background,
        padding: tokens.spacing.md,
        gap: tokens.spacing.md,
      }}
    >
      <Text variant="heading1" accessibilityRole="header">
        Notifications
      </Text>
      {!isConnected ? (
        <Text variant="caption" color={tokens.color.warning}>
          Offline — showing cached inbox when available.
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
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
              style={{
                paddingHorizontal: tokens.spacing.md,
                paddingVertical: tokens.spacing.sm,
                borderRadius: tokens.radius.md,
                backgroundColor: active
                  ? tokens.color.accent
                  : tokens.color.surface,
                borderWidth: 1,
                borderColor: tokens.color.border,
              }}
            >
              <Text
                variant="label"
                color={
                  active ? tokens.color.textInverse : tokens.color.textPrimary
                }
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {feed.isLoading ? (
        <NotificationListSkeleton />
      ) : (
        <FlatList
          data={feed.items}
          keyExtractor={(item) => item.notificationLogId}
          contentContainerStyle={{ gap: tokens.spacing.md, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={feed.isFetching && feed.items.length > 0}
              onRefresh={() => {
                void feed.refetch();
              }}
            />
          }
          onEndReached={() => feed.onLoadMore()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyState
              title={unreadOnly ? 'No unread notifications' : 'You are all caught up'}
              description={
                unreadOnly
                  ? 'Switch to All to see earlier messages.'
                  : 'Order and payment updates will show up here.'
              }
              accessibilityLabel="Notifications empty"
            />
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
    </View>
  );
}
