import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from 'foodie-shared-rn';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MainStackParamList } from './types';

export function BottomNav() {
    const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
    const currentRouteName = useNavigationState(state => state?.routes[state.index]?.name) ?? 'DeliveryHome';

    return (
        <View style={styles.bottomNavContainer}>
            <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('DeliveryHome')}>
                <Ionicons name="home" size={24} color={currentRouteName === 'DeliveryHome' ? '#F59E0B' : '#718096'} />
                <Text style={[styles.bottomNavText, currentRouteName === 'DeliveryHome' && { color: '#F59E0B' }]}>Home</Text>
            </Pressable>

            <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('DeliveryOffers' as any)}>
                <Ionicons name="receipt-outline" size={24} color={currentRouteName === 'DeliveryOffers' ? '#F59E0B' : '#718096'} />
                <Text style={[styles.bottomNavText, currentRouteName === 'DeliveryOffers' && { color: '#F59E0B' }]}>Orders</Text>
            </Pressable>

            <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('Wallet' as any)}>
                <Ionicons name="wallet-outline" size={24} color={currentRouteName === 'Wallet' ? '#F59E0B' : '#718096'} />
                <Text style={[styles.bottomNavText, currentRouteName === 'Wallet' && { color: '#F59E0B' }]}>Earnings</Text>
            </Pressable>

            <Pressable style={styles.bottomNavItem} onPress={() => navigation.navigate('DeliveryProfile' as any)}>
                <Ionicons name="ellipsis-horizontal-circle-outline" size={24} color={currentRouteName === 'DeliveryProfile' ? '#F59E0B' : '#718096'} />
                <Text style={[styles.bottomNavText, currentRouteName === 'DeliveryProfile' && { color: '#F59E0B' }]}>More</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    bottomNavContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingVertical: 12,
        paddingBottom: Platform.OS === 'ios' ? 30 : 12,
        elevation: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    bottomNavItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    bottomNavText: {
        fontSize: 12,
        marginTop: 4,
        color: '#718096',
        fontWeight: '600',
    }
});
