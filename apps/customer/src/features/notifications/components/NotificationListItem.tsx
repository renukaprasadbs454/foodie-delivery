import React from 'react';
import { Pressable, View } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';
import type { InboxNotification } from '../types';
import { isNotificationUnread } from '../types';

type Props = {
  notification: InboxNotification;
  onPress: () => void;
};

/** Inbox row — UI-API NotificationListItem. */
export function NotificationListItem({ notification, onPress }: Props) {
  const { tokens } = useTheme();
  const unread = isNotificationUnread(notification);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${notification.title}${unread ? ', unread' : ''}`}
      style={({ pressed }) => ({
        padding: 16,
        borderRadius: 16,
        backgroundColor: unread ? '#FDFDFD' : '#F9FAFB',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        shadowColor: '#14532D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: pressed ? 0.05 : 0.08,
        shadowRadius: 8,
        elevation: unread ? 4 : 1,
        borderWidth: 1,
        borderColor: unread ? 'rgba(245,158,11,0.3)' : '#F3F4F6',
      })}
    >
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: unread ? '#FEF3C7' : '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: unread ? '#F59E0B' : '#D1D5DB'
      }}>
        <Text style={{ fontSize: 20 }}>{notification.title.includes('Order') ? '🛵' : '🔔'}</Text>
      </View>

      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#111827', fontSize: 16, fontWeight: unread ? '800' : '600' }}>
            {notification.title}
          </Text>
          {unread ? (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B' }} />
          ) : null}
        </View>
        <Text style={{ color: '#4B5563', fontSize: 14, lineHeight: 20 }}>
          {notification.body}
        </Text>
        {notification.sentAt ? (
          <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4, fontWeight: '500' }}>
            {new Date(notification.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
