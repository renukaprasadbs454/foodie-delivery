import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { CartScreen } from '../features/cart/screens/CartScreen';
import { CheckoutScreen } from '../features/checkout/screens/CheckoutScreen';
import { PaymentScreen } from '../features/payment/screens/PaymentScreen';
import { MenuScreen } from '../features/menu/screens/MenuScreen';
import { LiveOrderTrackingScreen } from '../features/orders/screens/LiveOrderTrackingScreen';
import { MyOrdersScreen } from '../features/orders/screens/MyOrdersScreen';
import { OrderSuccessScreen } from '../features/orders/screens/OrderSuccessScreen';
import { AddressesScreen } from '../features/profile/screens/AddressesScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { SettingsScreen } from '../features/profile/screens/SettingsScreen';
import { NotificationsScreen } from '../features/notifications/screens/NotificationsScreen';
import { ReviewsScreen } from '../features/reviews/screens/ReviewsScreen';
import { HomeScreen } from '../features/restaurants/screens/HomeScreen';
import { RestaurantDetailsScreen } from '../features/restaurants/screens/RestaurantDetailsScreen';
import { RestaurantListingScreen } from '../features/restaurants/screens/RestaurantListingScreen';
import { SearchScreen } from '../features/restaurants/screens/SearchScreen';
import type {
  BrowseStackParamList,
  MainTabParamList,
  NotificationsStackParamList,
  OrdersStackParamList,
  ProfileStackParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const BrowseStack = createNativeStackNavigator<BrowseStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const NotificationsStack =
  createNativeStackNavigator<NotificationsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function BrowseStackNavigator() {
  return (
    <BrowseStack.Navigator screenOptions={{ headerShown: false }}>
      <BrowseStack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <BrowseStack.Screen
        name="RestaurantListing"
        component={RestaurantListingScreen}
        options={{ title: 'Listing' }}
      />
      <BrowseStack.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Search' }}
      />
      <BrowseStack.Screen
        name="RestaurantDetails"
        component={RestaurantDetailsScreen}
        options={{ title: 'Restaurant' }}
      />
      <BrowseStack.Screen
        name="Menu"
        component={MenuScreen}
        options={{ title: 'Menu' }}
      />
      <BrowseStack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Cart' }}
      />
      <BrowseStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
      <BrowseStack.Screen
        name="Payment"
        component={PaymentScreen}
        options={{ title: 'Payment' }}
      />
      <BrowseStack.Screen
        name="Addresses"
        component={AddressesScreen}
        options={{ title: 'Addresses' }}
      />
      <BrowseStack.Screen
        name="Reviews"
        component={ReviewsScreen}
        options={{ title: 'Reviews' }}
      />
    </BrowseStack.Navigator>
  );
}

function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{ title: 'Orders' }}
      />
      <OrdersStack.Screen
        name="OrderSuccess"
        component={OrderSuccessScreen}
        options={{ title: 'Order confirmed' }}
      />
      <OrdersStack.Screen
        name="LiveOrderTracking"
        component={LiveOrderTrackingScreen}
        options={{ title: 'Track order' }}
      />
      <OrdersStack.Screen
        name="Reviews"
        component={ReviewsScreen}
        options={{ title: 'Reviews' }}
      />
    </OrdersStack.Navigator>
  );
}

function NotificationsStackNavigator() {
  return (
    <NotificationsStack.Navigator screenOptions={{ headerShown: false }}>
      <NotificationsStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
    </NotificationsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStack.Screen
        name="Addresses"
        component={AddressesScreen}
        options={{ title: 'Addresses' }}
      />
      <ProfileStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </ProfileStack.Navigator>
  );
}

/**
 * Main tabs — System Design §5.1 Customer / P2-CUS-01…07.
 */
export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#14532D', // Primary Dark Green for active tab
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopWidth: 1.5,
          borderTopColor: '#E5E7EB',
          backgroundColor: '#FFFFFF',
          height: 80,
          paddingBottom: 16,
          paddingTop: 12,
          shadowColor: '#14532D',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
        },
        tabBarIcon: ({ focused }) => {
          let emoji = '🏠';
          if (route.name === 'BrowseTab') emoji = '🏠';
          else if (route.name === 'OrdersTab') emoji = '📋';
          else if (route.name === 'NotificationsTab') emoji = '🔔';
          else if (route.name === 'ProfileTab') emoji = '👤';

          return (
            <Text
              style={{
                fontSize: 20,
                opacity: focused ? 1 : 0.65,
              }}
            >
              {emoji}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen
        name="BrowseTab"
        component={BrowseStackNavigator}
        options={{ title: 'Home' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('BrowseTab', { screen: 'Home' });
          },
        })}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{ title: 'Orders' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('OrdersTab', { screen: 'MyOrders' });
          },
        })}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsStackNavigator}
        options={{ title: 'Notifications' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('NotificationsTab', { screen: 'Notifications' });
          },
        })}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ title: 'Profile' }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('ProfileTab', { screen: 'Profile' });
          },
        })}
      />
    </Tab.Navigator>
  );
}

