import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CategoriesScreen } from '../features/menu/screens/CategoriesScreen';
import { MenuItemsScreen } from '../features/menu/screens/MenuItemsScreen';
import { VariantsScreen } from '../features/menu/screens/VariantsScreen';
import { PendingApprovalScreen } from '../features/onboarding/screens/PendingApprovalScreen';
import { RestaurantDocumentsScreen } from '../features/onboarding/screens/RestaurantDocumentsScreen';
import { RestaurantImagesScreen } from '../features/onboarding/screens/RestaurantImagesScreen';
import { DashboardScreen } from '../features/orders/screens/DashboardScreen';
import { IncomingOrdersScreen } from '../features/orders/screens/IncomingOrdersScreen';
import { RestaurantOrderDetailsScreen } from '../features/orders/screens/RestaurantOrderDetailsScreen';
import { NotificationsGapShellScreen } from '../features/notifications/screens/NotificationsGapShellScreen';
import { RestaurantProfileScreen } from '../features/profile/screens/RestaurantProfileScreen';
import { RestaurantSettingsScreen } from '../features/profile/screens/RestaurantSettingsScreen';
import { RestaurantReviewsScreen } from '../features/reviews/screens/RestaurantReviewsScreen';
import type {
  MainTabParamList,
  MenuStackParamList,
  OrdersStackParamList,
  ProfileStackParamList,
  ReviewsStackParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const MenuStack = createNativeStackNavigator<MenuStackParamList>();
const ReviewsStack = createNativeStackNavigator<ReviewsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator>
      <OrdersStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <OrdersStack.Screen
        name="IncomingOrders"
        component={IncomingOrdersScreen}
        options={{ title: 'Incoming orders' }}
      />
      <OrdersStack.Screen
        name="RestaurantOrderDetails"
        component={RestaurantOrderDetailsScreen}
        options={{ title: 'Order' }}
      />
    </OrdersStack.Navigator>
  );
}

function MenuStackNavigator() {
  return (
    <MenuStack.Navigator>
      <MenuStack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: 'Categories' }}
      />
      <MenuStack.Screen
        name="MenuItems"
        component={MenuItemsScreen}
        options={{ title: 'Menu items' }}
      />
      <MenuStack.Screen
        name="Variants"
        component={VariantsScreen}
        options={{ title: 'Variants' }}
      />
    </MenuStack.Navigator>
  );
}

function ReviewsStackNavigator() {
  return (
    <ReviewsStack.Navigator>
      <ReviewsStack.Screen
        name="RestaurantReviews"
        component={RestaurantReviewsScreen}
        options={{ title: 'Reviews' }}
      />
    </ReviewsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="RestaurantProfile"
        component={RestaurantProfileScreen}
        options={{ title: 'Profile' }}
      />
      <ProfileStack.Screen
        name="RestaurantSettings"
        component={RestaurantSettingsScreen}
        options={{ title: 'Settings' }}
      />
      <ProfileStack.Screen
        name="RestaurantDocuments"
        component={RestaurantDocumentsScreen}
        options={{ title: 'Documents' }}
      />
      <ProfileStack.Screen
        name="RestaurantImages"
        component={RestaurantImagesScreen}
        options={{ title: 'Images' }}
      />
      <ProfileStack.Screen
        name="PendingApproval"
        component={PendingApprovalScreen}
        options={{ title: 'Pending approval' }}
      />
      <ProfileStack.Screen
        name="NotificationsHome"
        component={NotificationsGapShellScreen}
        options={{ title: 'Notifications' }}
      />
    </ProfileStack.Navigator>
  );
}

/**
 * Main tabs — System Design §5.1 Restaurant:
 * Orders (primary home), Menu, Reviews, Profile.
 * P2-RES-04 Profile/Reviews/Settings; P2-RES-05 Gap shell for /notifications.
 */
export function MainNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{ title: 'Orders' }}
      />
      <Tab.Screen
        name="MenuTab"
        component={MenuStackNavigator}
        options={{ title: 'Menu' }}
      />
      <Tab.Screen
        name="ReviewsTab"
        component={ReviewsStackNavigator}
        options={{ title: 'Reviews' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}
