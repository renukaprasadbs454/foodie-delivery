import React, { useEffect, useState, useRef } from 'react';
import { FlatList, Pressable, RefreshControl, View, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const scaleValue = useRef(new Animated.Value(0.95)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) => setToast({ message: error.message, variant: 'error' }),
    onInlineField: (error) => setToast({ message: error.message, variant: 'error' }),
    onFullScreen: (error) => setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) => setToast({ message: error.message, variant: 'error' }),
  });

  useEffect(() => {
    trackAnalyticsEvent('customer_notifications_viewed');
    Animated.parallel([
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const onOpen = async (notificationLogId: string) => {
    const current = feed.items.find((n) => n.notificationLogId === notificationLogId);
    trackAnalyticsEvent('notification_opened', { notificationLogId });
    if (!current || !isNotificationUnread(current)) {
      return;
    }
    if (!isConnected) {
      setToast({ message: 'Connect to the internet to mark as read.', variant: 'warning' });
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#14532D' }} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#14532D" barStyle="light-content" />
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: '#F2F2F7',
          opacity: fadeValue,
          transform: [{ scale: scaleValue }],
        }}
      >
        {/* iOS Styled Top curved Header */}
        <View style={{
          paddingTop: 36,
          paddingBottom: 24,
          paddingHorizontal: 20,
          backgroundColor: '#14532D',
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          shadowColor: '#14532D',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 5
        }}>
          <Text style={{ fontSize: 32, fontWeight: '900', color: '#FCD34D', letterSpacing: -0.5 }}>
            Notifications
          </Text>
          {!isConnected ? (
            <Text style={{ color: '#FCD34D', fontSize: 13, marginTop: 4, fontWeight: '700' }}>
              Offline — showing cached inbox
            </Text>
          ) : null}
        </View>

        {/* Filter Toolbar */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
          gap: 12
        }}>
          {(
            [
              { label: 'All Messages', value: false },
              { label: 'Unread Only', value: true },
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
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: active ? '#14532D' : '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: active ? '#FCD34D' : '#E5E7EB',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: active ? 0.1 : 0,
                  shadowRadius: 4,
                  elevation: active ? 2 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '800',
                    color: active ? '#FCD34D' : '#4B5563',
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Notifications List */}
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          {feed.isLoading ? (
            <NotificationListSkeleton />
          ) : (
            <FlatList
              data={feed.items}
              keyExtractor={(item) => item.notificationLogId}
              contentContainerStyle={{ gap: 12, paddingBottom: 48, paddingTop: 8 }}
              refreshControl={
                <RefreshControl
                  refreshing={feed.isFetching && feed.items.length > 0}
                  onRefresh={() => { void feed.refetch(); }}
                  tintColor="#FCD34D"
                />
              }
              onEndReached={() => feed.onLoadMore()}
              onEndReachedThreshold={0.4}
              ListEmptyComponent={
                <View style={{ marginTop: 60, alignItems: 'center' }}>
                  <Text style={{ fontSize: 64, marginBottom: 16 }}>🔔</Text>
                  <Text style={{ textAlign: 'center', color: '#14532D', fontWeight: '900', fontSize: 18, marginBottom: 8 }}>
                    {unreadOnly ? 'No unread notifications' : 'You are all caught up'}
                  </Text>
                  <Text style={{ textAlign: 'center', color: '#6B7280', fontSize: 14, marginHorizontal: 24 }}>
                    {unreadOnly
                      ? 'Switch to All to see earlier messages.'
                      : 'Order and payment updates will show up here.'}
                  </Text>
                </View>
              }
              renderItem={({ item }) => (
                <View style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  overflow: 'hidden',
                  borderWidth: 1.5,
                  borderColor: isNotificationUnread(item) ? '#FCD34D' : '#E5E7EB',
                }}>
                  <NotificationListItem
                    notification={item}
                    onPress={() => {
                      void onOpen(item.notificationLogId);
                    }}
                  />
                </View>
              )}
            />
          )}
        </View>

        <Toast
          visible={Boolean(toast)}
          message={toast?.message ?? ''}
          variant={toast?.variant ?? 'info'}
          accessibilityLabel={toast?.message ?? 'Toast'}
          onDismiss={() => setToast(null)}
        />
      </Animated.View>
    </SafeAreaView>
  );
}
