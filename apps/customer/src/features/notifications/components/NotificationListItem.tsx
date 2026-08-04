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
      style={{
        padding: tokens.spacing.md,
        borderRadius: tokens.radius.md,
        borderWidth: 1,
        borderColor: tokens.color.border,
        backgroundColor: unread ? tokens.color.surface : tokens.color.background,
        gap: tokens.spacing.xs,
        opacity: unread ? 1 : 0.75,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: tokens.spacing.sm,
        }}
      >
        <Text variant="label" style={{ flex: 1 }}>
          {notification.title}
        </Text>
        {unread ? (
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: tokens.color.accent,
            }}
            accessibilityLabel="Unread"
          />
        ) : null}
      </View>
      <Text variant="body" color={tokens.color.textSecondary}>
        {notification.body}
      </Text>
      {notification.sentAt ? (
        <Text variant="caption" color={tokens.color.textSecondary}>
          {new Date(notification.sentAt).toLocaleString()}
        </Text>
      ) : null}
    </Pressable>
  );
}
