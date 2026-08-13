import React from 'react';
import { View } from 'react-native';
import { Button, Card, Text, useTheme } from 'foodie-shared-rn';

type Props = {
  ratingFilter?: number | null;
  onRefresh?: () => void;
  isFetching?: boolean;
};

const BRAND_PRIMARY = '#14532D';

export function ReviewEmptyState({ ratingFilter, onRefresh, isFetching }: Props) {
  const { tokens } = useTheme();

  const title = ratingFilter
    ? `No ${ratingFilter}-Star Reviews Yet`
    : 'No Customer Reviews Yet';

  const description = ratingFilter
    ? `No customer reviews currently match the ${ratingFilter}-star rating filter.`
    : 'Verified customer reviews for your restaurant dishes and delivery service will appear here.';

  return (
    <Card
      style={{
        padding: tokens.spacing.xl,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: tokens.spacing.sm,
        backgroundColor: tokens.color.surface,
        borderColor: tokens.color.border,
        borderWidth: 1,
        marginVertical: tokens.spacing.md,
      }}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: '#FEF3C7',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 4,
        }}
      >
        <Text style={{ fontSize: 30, color: '#F59E0B' }}>⭐</Text>
      </View>

      <Text
        variant="heading2"
        style={{ color: BRAND_PRIMARY, textAlign: 'center', fontSize: 18 }}
      >
        {title}
      </Text>

      <Text
        variant="body"
        color={tokens.color.textSecondary}
        style={{ textAlign: 'center', maxWidth: 360, fontSize: 14 }}
      >
        {description}
      </Text>

      {onRefresh ? (
        <Button
          label="🔄 Refresh Reviews"
          accessibilityLabel="Refresh reviews"
          variant="secondary"
          loading={isFetching}
          onPress={onRefresh}
          style={{ marginTop: tokens.spacing.xs }}
        />
      ) : null}
    </Card>
  );
}
