import React, { useEffect, useState, useRef } from 'react';
import { FlatList, RefreshControl, View, StatusBar, Animated, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  EmptyState,
  Text,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import type { OrdersStackParamList } from '../../../navigation/types';
import { OrderListItem } from '../components/OrderListItem';
import { OrderListSkeleton } from '../components/OrderListSkeleton';
import { useMyOrdersFeed } from '../hooks/useMyOrdersFeed';
import { useAddCartItemMutation } from '../../../api/endpoints/cartApi';

type Props = NativeStackScreenProps<OrdersStackParamList, 'MyOrders'>;

export function MyOrdersScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const [addCartItem] = useAddCartItemMutation();

  const feed = useMyOrdersFeed({
    sort: 'placedAt',
  });

  const scaleValue = useRef(new Animated.Value(0.95)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    trackAnalyticsEvent('customer_my_orders_viewed');
    trackAnalyticsEvent('orders_list_loaded');
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
        {/* Curved Header */}
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
          <Text style={{ color: '#FCD34D', fontSize: 32, fontWeight: '900', letterSpacing: -0.5 }}>
            My Orders
          </Text>
          <Text style={{ color: '#A7F3D0', fontSize: 13, marginTop: 4, fontWeight: '600' }}>
            Check order status and reorder meals instantly
          </Text>
        </View>

        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
          {!isConnected ? (
            <View style={{ backgroundColor: '#FEF2F2', marginBottom: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FCA5A5' }}>
              <Text style={{ color: '#DC2626', fontWeight: '800', fontSize: 13 }}>
                Offline — showing cached history.
              </Text>
            </View>
          ) : null}

          {feed.isLoading ? (
            <OrderListSkeleton />
          ) : (
            <FlatList
              data={feed.items}
              keyExtractor={(item) => item.orderId}
              contentContainerStyle={{ gap: 12, paddingBottom: 48 }}
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
                  <Text style={{ fontSize: 64, marginBottom: 16 }}>📦</Text>
                  <Text style={{ textAlign: 'center', color: '#14532D', fontWeight: '900', fontSize: 18, marginBottom: 8 }}>
                    No Orders Yet
                  </Text>
                  <Text style={{ textAlign: 'center', color: '#6B7280', fontSize: 14, marginHorizontal: 32, marginBottom: 24 }}>
                    Good food is waiting! Discover top local cuisines and place your first order.
                  </Text>
                  <Pressable
                    onPress={() => {
                      const parent = navigation.getParent();
                      if (parent) {
                        parent.navigate('BrowseTab' as never);
                      } else {
                        navigation.navigate('Home' as any);
                      }
                    }}
                    style={{
                      backgroundColor: '#14532D',
                      paddingHorizontal: 24,
                      paddingVertical: 12,
                      borderRadius: 24,
                      borderWidth: 1.5,
                      borderColor: '#FCD34D',
                    }}
                  >
                    <Text style={{ color: '#FCD34D', fontWeight: '800' }}>Browse Restaurants</Text>
                  </Pressable>
                </View>
              }
              renderItem={({ item }) => (
                <OrderListItem
                  order={item}
                  onPress={() => {
                    trackAnalyticsEvent('order_row_tapped', {
                      orderId: item.orderId,
                    });
                    navigation.navigate('LiveOrderTracking', {
                      orderId: item.orderId,
                    });
                  }}
                  onReorder={() => {
                    addCartItem({
                      menuItemId: `${item.restaurantId || 'mock-resto-1'}-item-mock`,
                      quantity: 1,
                      notes: 'Reorder from history'
                    }).then(() => {
                      const parent = navigation.getParent();
                      if (parent) {
                        parent.navigate('CartTab' as never);
                      } else {
                        navigation.navigate('Cart' as any);
                      }
                    });
                  }}
                  onRate={() => {
                    navigation.navigate('Reviews', {
                      mode: 'submit',
                      orderId: item.orderId,
                      restaurantId: item.restaurantId || 'mock-resto-1'
                    });
                  }}
                />
              )}
            />
          )}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
