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
      style={[
        styles.cardContainer,
        unread ? styles.cardUnread : styles.cardRead
      ]}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleWrapper}>
          <Text style={styles.titleText}>{notification.title}</Text>
        </View>
        {unread ? (
          <View style={styles.unreadDot} accessibilityLabel="Unread" />
        ) : (
          <Feather name="check" size={14} color="#A0AEC0" />
        )}
      </View>
      <Text style={styles.bodyText}>{notification.body}</Text>

      {notification.sentAt && (
        <View style={styles.footerRow}>
          <Feather name="clock" size={12} color="#A0AEC0" />
          <Text style={styles.timeText}>
            {new Date(notification.sentAt as string).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

import { StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardUnread: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardRead: {
    backgroundColor: '#F8FAFC',
    opacity: 0.8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 16,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A202C',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F59E0B',
    marginTop: 4,
  },
  bodyText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  timeText: {
    fontSize: 12,
    color: '#A0AEC0',
    fontWeight: '500',
    marginLeft: 6,
  },
});
