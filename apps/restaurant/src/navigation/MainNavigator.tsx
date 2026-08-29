import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'foodie-shared-rn';
import { RestaurantHeader } from '../components/RestaurantHeader';
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
import { BankAndBusinessDetailsScreen } from '../features/profile/screens/BankAndBusinessDetailsScreen';
import { RestaurantLocationScreen } from '../features/profile/screens/RestaurantLocationScreen';
import { RestaurantProfileScreen } from '../features/profile/screens/RestaurantProfileScreen';
import { RestaurantSettingsScreen } from '../features/profile/screens/RestaurantSettingsScreen';
import { SettlementHistoryScreen } from '../features/profile/screens/SettlementHistoryScreen';
import { RestaurantReviewsScreen } from '../features/reviews/screens/RestaurantReviewsScreen';
import type {
  MainTabParamList,
  MenuStackParamList,
  OrdersStackParamList,
  ProfileStackParamList,
  ReviewsStackParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const DashboardStack = createNativeStackNavigator<OrdersStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const MenuStack = createNativeStackNavigator<MenuStackParamList>();
const ReviewsStack = createNativeStackNavigator<ReviewsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const customHeaderOption = {
  header: ({ options, navigation, back }: any) => (
    <RestaurantHeader
      title={options.title}
      navigation={navigation}
      showBack={Boolean(back)}
    />
  ),
};

function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={customHeaderOption}>
      <DashboardStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
    </DashboardStack.Navigator>
  );
}

function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={customHeaderOption}>
      <OrdersStack.Screen
        name="IncomingOrders"
        component={IncomingOrdersScreen}
        options={{ title: 'Order Management' }}
      />
      <OrdersStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <OrdersStack.Screen
        name="RestaurantOrderDetails"
        component={RestaurantOrderDetailsScreen}
        options={{ title: 'Order Details' }}
      />
    </OrdersStack.Navigator>
  );
}

function MenuStackNavigator() {
  return (
    <MenuStack.Navigator screenOptions={customHeaderOption}>
      <MenuStack.Screen
        name="MenuItems"
        component={MenuItemsScreen}
        options={{ title: 'Menu Management' }}
      />
      <MenuStack.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: 'Categories' }}
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
    <ReviewsStack.Navigator screenOptions={customHeaderOption}>
      <ReviewsStack.Screen
        name="RestaurantReviews"
        component={RestaurantReviewsScreen}
        options={{ title: 'Customer Reviews' }}
      />
    </ReviewsStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={customHeaderOption}>
      <ProfileStack.Screen
        name="RestaurantProfile"
        component={RestaurantProfileScreen}
        options={{ title: 'Restaurant Profile' }}
      />
      <ProfileStack.Screen
        name="BankAndBusinessDetails"
        component={BankAndBusinessDetailsScreen}
        options={{ title: 'Bank & Business Details' }}
      />
      <ProfileStack.Screen
        name="RestaurantLocation"
        component={RestaurantLocationScreen}
        options={{ title: 'Restaurant Location' }}
      />
      <ProfileStack.Screen
        name="RestaurantSettings"
        component={RestaurantSettingsScreen}
        options={{ title: 'Settings' }}
      />
      <ProfileStack.Screen
        name="SettlementHistory"
        component={SettlementHistoryScreen}
        options={{ title: 'Payment & Settlements' }}
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
        options={{ title: 'Pending Approval' }}
      />
      <ProfileStack.Screen
        name="NotificationsHome"
        component={NotificationsGapShellScreen}
        options={{ title: 'Notifications' }}
      />
    </ProfileStack.Navigator>
  );
}

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.65 }}>{icon}</Text>
      {focused ? (
        <View
          style={{
            width: 12,
            height: 3,
            borderRadius: 2,
            backgroundColor: '#F59E0B',
            marginTop: 3,
          }}
        />
      ) : null}
    </View>
  );
}

export function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#14532D',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStackNavigator}
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MenuTab"
        component={MenuStackNavigator}
        options={{
          title: 'Menu',
          tabBarIcon: ({ focused }) => <TabIcon icon="🍽️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ReviewsTab"
        component={ReviewsStackNavigator}
        options={{
          title: 'Reviews',
          tabBarIcon: ({ focused }) => <TabIcon icon="⭐" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
