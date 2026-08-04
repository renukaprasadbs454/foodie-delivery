import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Button,
  EmptyState,
  Modal,
  Text,
  TextInput,
  Toast,
  trackAnalyticsEvent,
  useApiErrorHandler,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetOrderQuery } from '../../../api/endpoints/ordersApi';
import { useGetRestaurantReviewsQuery } from '../../../api/endpoints/restaurantsApi';
import { useSubmitReviewMutation } from '../../../api/endpoints/reviewsApi';
import { toUnwrappedApiError } from '../../auth/apiError';
import { isOrderId } from '../../orders/types';
import { isRestaurantId } from '../../restaurants/types';
import type {
  BrowseStackParamList,
  OrdersStackParamList,
} from '../../../navigation/types';
import { ReviewListItem } from '../components/ReviewListItem';
import { ReviewListSkeleton } from '../components/ReviewListSkeleton';
import { StarRating } from '../components/StarRating';
import {
  MAX_REVIEW_COMMENT_LENGTH,
  validateDeliveryRating,
  validateRestaurantRating,
  validateReviewComment,
} from '../types';

type OrdersProps = NativeStackScreenProps<OrdersStackParamList, 'Reviews'>;
type BrowseProps = NativeStackScreenProps<BrowseStackParamList, 'Reviews'>;
type Props = OrdersProps | BrowseProps;

/**
 * P2-CUS-08 Reviews — submit (DELIVERED order) or public restaurant list.
 */
export function ReviewsScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const mode = route.params.mode;
  const orderId = route.params.orderId;
  const restaurantIdParam = route.params.restaurantId;

  const [restaurantRating, setRestaurantRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [alreadyExistsVisible, setAlreadyExistsVisible] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const validOrderId = Boolean(orderId && isOrderId(orderId));
  const orderQuery = useGetOrderQuery(orderId ?? '', {
    skip: mode !== 'submit' || !validOrderId,
  });

  const restaurantId =
    restaurantIdParam && isRestaurantId(restaurantIdParam)
      ? restaurantIdParam
      : orderQuery.data?.restaurantId &&
          isRestaurantId(orderQuery.data.restaurantId)
        ? orderQuery.data.restaurantId
        : undefined;

  const reviewsQuery = useGetRestaurantReviewsQuery(
    { restaurantId: restaurantId ?? '', sort: 'createdAt' },
    { skip: mode !== 'list' || !restaurantId },
  );

  const [submitReview, submitState] = useSubmitReviewMutation();

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
    trackAnalyticsEvent('customer_reviews_viewed', {
      mode,
      orderId,
      restaurantId,
    });
  }, [mode, orderId, restaurantId]);

  const onSubmit = async () => {
    if (!validOrderId || !orderId) {
      setToast({ message: 'Invalid order.', variant: 'error' });
      return;
    }
    const ratingResult = validateRestaurantRating(restaurantRating);
    if (!ratingResult.ok) {
      setToast({ message: ratingResult.message, variant: 'error' });
      return;
    }
    const deliveryResult = validateDeliveryRating(deliveryRating);
    if (!deliveryResult.ok) {
      setToast({ message: deliveryResult.message, variant: 'error' });
      return;
    }
    const commentResult = validateReviewComment(comment);
    if (!commentResult.ok) {
      setToast({ message: commentResult.message, variant: 'error' });
      return;
    }
    if (!isConnected) {
      setToast({
        message: 'Connect to the internet to submit a review.',
        variant: 'warning',
      });
      return;
    }
    if (orderQuery.data && orderQuery.data.status !== 'DELIVERED') {
      setToast({
        message: 'Only delivered orders can be reviewed.',
        variant: 'error',
      });
      return;
    }
    try {
      await submitReview({
        orderId,
        restaurantRating: ratingResult.rating,
        deliveryRating: deliveryResult.rating,
        comment: commentResult.comment,
      }).unwrap();
      trackAnalyticsEvent('review_submitted', { orderId });
      trackAnalyticsEvent('review_created', { orderId });
      setToast({ message: 'Review submitted. Thank you!', variant: 'success' });
      if (restaurantId) {
        (
          navigation as OrdersProps['navigation'] & BrowseProps['navigation']
        ).replace('Reviews', {
          mode: 'list',
          restaurantId,
        });
      } else {
        (navigation as OrdersProps['navigation']).navigate('MyOrders');
      }
    } catch (error) {
      const unwrapped = toUnwrappedApiError(error);
      if (unwrapped.code === 'REVIEW_ALREADY_EXISTS') {
        setAlreadyExistsVisible(true);
        return;
      }
      handleError(unwrapped);
    }
  };

  if (mode === 'list') {
    if (!restaurantId) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: tokens.color.background,
            padding: tokens.spacing.xl,
            justifyContent: 'center',
          }}
        >
          <EmptyState
            title="Restaurant required"
            description="Open reviews from a restaurant to see public ratings."
            accessibilityLabel="Reviews list missing restaurant"
            actionLabel="Back"
            onAction={() => navigation.goBack()}
          />
        </View>
      );
    }

    const items = reviewsQuery.data ?? [];

    return (
      <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
        <FlatList
          data={items}
          keyExtractor={(item, index) =>
            `${item.createdAt ?? 'review'}-${item.restaurantRating}-${index}`
          }
          contentContainerStyle={{
            padding: tokens.spacing.md,
            gap: tokens.spacing.md,
            paddingBottom: 48,
          }}
          ListHeaderComponent={
            <Text variant="heading1" accessibilityRole="header">
              Reviews
            </Text>
          }
          refreshControl={
            <RefreshControl
              refreshing={reviewsQuery.isFetching}
              onRefresh={() => {
                void reviewsQuery.refetch();
              }}
            />
          }
          ListEmptyComponent={
            reviewsQuery.isLoading ? (
              <ReviewListSkeleton />
            ) : (
              <EmptyState
                title="No reviews yet"
                description="Be the first to review after an order."
                accessibilityLabel="Restaurant reviews empty"
              />
            )
          }
          renderItem={({ item }) => <ReviewListItem review={item} />}
        />
      </View>
    );
  }

  // submit mode
  if (!validOrderId) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.color.background,
          padding: tokens.spacing.xl,
          justifyContent: 'center',
        }}
      >
        <EmptyState
          title="Invalid order"
          description="This review link is not valid."
          accessibilityLabel="Invalid review order"
          actionLabel="Back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.color.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: tokens.spacing.md,
          gap: tokens.spacing.md,
          paddingBottom: 48,
        }}
      >
        <Text variant="heading1" accessibilityRole="header">
          Leave a review
        </Text>
        {orderQuery.data ? (
          <Text variant="caption" color={tokens.color.textSecondary}>
            Order {orderQuery.data.orderNumber} · {orderQuery.data.status}
          </Text>
        ) : null}
        {!isConnected ? (
          <Text variant="caption" color={tokens.color.warning}>
            Offline — submit is blocked.
          </Text>
        ) : null}

        <StarRating
          label="Restaurant"
          accessibilityLabel="Restaurant rating"
          value={restaurantRating}
          onChange={setRestaurantRating}
        />
        <StarRating
          label="Delivery (optional)"
          accessibilityLabel="Delivery rating"
          value={deliveryRating ?? 0}
          onChange={(v) => setDeliveryRating(v)}
        />
        <Button
          label="Clear delivery rating"
          accessibilityLabel="Clear delivery rating"
          variant="secondary"
          onPress={() => setDeliveryRating(null)}
        />

        <TextInput
          label="Comment"
          value={comment}
          onChangeText={setComment}
          accessibilityLabel="Review comment"
          multiline
          maxLength={MAX_REVIEW_COMMENT_LENGTH}
          placeholder="How was your order?"
        />

        <Button
          label="Submit review"
          accessibilityLabel="Submit review"
          loading={submitState.isLoading}
          disabled={!isConnected}
          onPress={() => {
            void onSubmit();
          }}
        />
        <Button
          label="Cancel"
          accessibilityLabel="Cancel review"
          variant="secondary"
          onPress={() => navigation.goBack()}
        />
      </ScrollView>

      <Modal
        visible={alreadyExistsVisible}
        onRequestClose={() => setAlreadyExistsVisible(false)}
        title="Already reviewed"
        accessibilityLabel="Review already exists"
      >
        <View style={{ gap: tokens.spacing.md }}>
          <Text variant="body">
            You already submitted a review for this order.
          </Text>
          <Button
            label="OK"
            accessibilityLabel="Dismiss already reviewed"
            onPress={() => {
              setAlreadyExistsVisible(false);
              navigation.goBack();
            }}
          />
        </View>
      </Modal>

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
