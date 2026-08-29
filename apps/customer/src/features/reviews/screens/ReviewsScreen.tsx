import React, { useEffect, useState, useRef } from 'react';
import { FlatList, RefreshControl, ScrollView, View, StatusBar, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

  const scaleValue = useRef(new Animated.Value(0.95)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  const validOrderId = Boolean(orderId && isOrderId(orderId));
  const orderQuery = useGetOrderQuery(orderId ?? '', {
    skip: mode !== 'submit' || !validOrderId,
  });

  const restaurantId =
    restaurantIdParam && isRestaurantId(restaurantIdParam)
      ? restaurantIdParam
      : orderQuery.data?.restaurantId && isRestaurantId(orderQuery.data.restaurantId)
        ? orderQuery.data.restaurantId
        : undefined;

  const reviewsQuery = useGetRestaurantReviewsQuery(
    { restaurantId: restaurantId ?? '', sort: 'createdAt' },
    { skip: mode !== 'list' || !restaurantId },
  );

  const [submitReview, submitState] = useSubmitReviewMutation();

  const handleError = useApiErrorHandler({
    onToast: (error) => setToast({ message: error.message, variant: 'error' }),
    onModalBlocking: (error) => setToast({ message: error.message, variant: 'error' }),
    onInlineField: (error) => setToast({ message: error.message, variant: 'error' }),
    onFullScreen: (error) => setToast({ message: error.message, variant: 'error' }),
    onGeneric: (error) => setToast({ message: error.message, variant: 'error' }),
  });

  useEffect(() => {
    trackAnalyticsEvent('customer_reviews_viewed', { mode, orderId, restaurantId });
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
      setToast({ message: 'Connect to the internet to submit a review.', variant: 'warning' });
      return;
    }
    if (orderQuery.data && orderQuery.data.status !== 'DELIVERED') {
      setToast({ message: 'Only delivered orders can be reviewed.', variant: 'error' });
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
        (navigation as OrdersProps['navigation'] & BrowseProps['navigation']).replace('Reviews', {
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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#14532D' }}>
          <View style={{ flex: 1, backgroundColor: '#F2F2F7', justifyContent: 'center', padding: 24 }}>
            <EmptyState
              title="Restaurant required"
              description="Open reviews from a restaurant to see public ratings."
              accessibilityLabel="Reviews list missing restaurant"
              actionLabel="Back"
              onAction={() => navigation.goBack()}
            />
          </View>
        </SafeAreaView>
      );
    }

    const items = reviewsQuery.data ?? [];

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#14532D' }}>
        <StatusBar backgroundColor="#14532D" barStyle="light-content" />
        <Animated.View style={{ flex: 1, backgroundColor: '#F2F2F7', opacity: fadeValue, transform: [{ scale: scaleValue }] }}>
          {/* Header Banner */}
          <View style={{
            paddingVertical: 20,
            paddingHorizontal: 20,
            backgroundColor: '#14532D',
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            paddingBottom: 28,
            shadowColor: '#14532D',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 5,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <View>
              <Text style={{ color: '#FCD34D', fontSize: 30, fontWeight: '900', letterSpacing: -0.5 }}>
                Restaurant Reviews
              </Text>
              <Text style={{ color: '#A7F3D0', fontSize: 13, marginTop: 4, fontWeight: '600' }}>
                Customer dining feedback logs
              </Text>
            </View>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.25)'
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 13 }}>Back</Text>
            </Pressable>
          </View>

          <FlatList
            data={items}
            keyExtractor={(item, index) => `${item.createdAt ?? 'review'}-${item.restaurantRating}-${index}`}
            contentContainerStyle={{
              padding: 16,
              gap: 12,
              paddingBottom: 48,
            }}
            refreshControl={
              <RefreshControl
                refreshing={reviewsQuery.isFetching}
                onRefresh={() => { void reviewsQuery.refetch(); }}
                tintColor="#FCD34D"
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
        </Animated.View>
      </SafeAreaView>
    );
  }

  // submit mode
  if (!validOrderId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#14532D' }} edges={['top', 'left', 'right']}>
        <View style={{ flex: 1, backgroundColor: '#F2F2F7', justifyContent: 'center', padding: 24 }}>
          <EmptyState
            title="Invalid order"
            description="This review link is not valid."
            accessibilityLabel="Invalid review order"
            actionLabel="Back"
            onAction={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#14532D' }} edges={['top', 'left', 'right']}>
      <StatusBar backgroundColor="#14532D" barStyle="light-content" />
      <Animated.View style={{ flex: 1, backgroundColor: '#F2F2F7', opacity: fadeValue, transform: [{ scale: scaleValue }] }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 48 }} bounces={false}>
          {/* Curved top header */}
          <View style={{
            paddingTop: 12,
            paddingBottom: 20,
            paddingHorizontal: 20,
            backgroundColor: '#14532D',
            borderBottomLeftRadius: 36,
            borderBottomRightRadius: 36,
            alignItems: 'center',
            shadowColor: '#14532D',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 5
          }}>
            <Text style={{ color: '#FCD34D', fontSize: 26, fontWeight: '900', textAlign: 'center' }}>
              Submit Feedback
            </Text>
            <Text style={{ color: '#A7F3D0', fontWeight: '700', fontSize: 14, marginTop: 4 }}>
              Rate your experience
            </Text>
            {orderQuery.data && (
              <View style={{ backgroundColor: 'rgba(252, 211, 77, 0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 12, borderWidth: 1.2, borderColor: 'rgba(252, 211, 77, 0.3)' }}>
                <Text style={{ color: '#FEF3C7', fontWeight: '800', fontSize: 13 }}>
                  Reference #{orderQuery.data.orderNumber}
                </Text>
              </View>
            )}
          </View>

          {/* Form Card Content */}
          <View style={{
            padding: 20,
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            marginHorizontal: 16,
            marginTop: -24,
            elevation: 5,
            shadowColor: '#14532D',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            gap: 20
          }}>
            {!isConnected && (
              <View style={{ padding: 12, backgroundColor: '#FEE2E2', borderRadius: 12 }}>
                <Text style={{ color: '#B91C1C', fontWeight: '800', fontSize: 13, textAlign: 'center' }}>
                  Offline — submit is blocked
                </Text>
              </View>
            )}

            <StarRating
              label="Rate Restaurant Dining"
              accessibilityLabel="Restaurant rating"
              value={restaurantRating}
              onChange={setRestaurantRating}
            />

            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 }} />

            <StarRating
              label="Rate Delivery Executive (Optional)"
              accessibilityLabel="Delivery rating"
              value={deliveryRating ?? 0}
              onChange={(v) => setDeliveryRating(v)}
            />

            <Pressable
              onPress={() => setDeliveryRating(null)}
              style={({ pressed }) => ({
                alignSelf: 'flex-start',
                backgroundColor: pressed ? '#F2F2F7' : 'transparent',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              })}
            >
              <Text style={{ fontSize: 13, color: '#DC2626', fontWeight: '700' }}>
                Clear delivery rating
              </Text>
            </Pressable>

            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 4 }} />

            <TextInput
              label="Gourmet Dining Notes"
              value={comment}
              onChangeText={setComment}
              accessibilityLabel="Review comment"
              multiline
              maxLength={MAX_REVIEW_COMMENT_LENGTH}
              placeholder="Share details about flavor, portion sizes, preparation..."
              containerStyle={{
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                borderWidth: 1.5,
                borderColor: '#E5E7EB',
                height: 100,
                padding: 12
              }}
            />

            <View style={{ gap: 10, marginTop: 8 }}>
              <Pressable
                disabled={!isConnected || submitState.isLoading}
                onPress={() => { void onSubmit(); }}
                style={({ pressed }) => ({
                  backgroundColor: pressed || !isConnected ? '#0F3E22' : '#14532D',
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: '#FCD34D',
                })}
              >
                <Text style={{ color: '#FCD34D', fontWeight: '900', fontSize: 16 }}>
                  {submitState.isLoading ? 'Submitting...' : 'Submit Review'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => navigation.goBack()}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#F3F4F6' : '#FFFFFF',
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: '#E5E7EB',
                })}
              >
                <Text style={{ color: '#4B5563', fontWeight: '800', fontSize: 14 }}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={alreadyExistsVisible}
          onRequestClose={() => setAlreadyExistsVisible(false)}
          title="Already reviewed"
          accessibilityLabel="Review already exists"
        >
          <View style={{ gap: tokens.spacing.md, padding: 8 }}>
            <Text style={{ fontSize: 16, color: '#4B5563', marginBottom: 12 }}>
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
      </Animated.View>
    </SafeAreaView>
  );
}
