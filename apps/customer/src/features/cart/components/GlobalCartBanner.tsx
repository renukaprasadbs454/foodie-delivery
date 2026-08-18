import React from 'react';
import { Pressable, View } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';
import { useNavigation } from '@react-navigation/native';
import { useGetCartQuery } from '../../../api/endpoints/cartApi';
import { formatMoney } from '../../menu/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { MOCK_RESTAURANTS } from '../../restaurants/mockData';

export function GlobalCartBanner() {
    const { tokens } = useTheme();
    const navigation = useNavigation<any>();
    const cartQuery = useGetCartQuery();

    const cartItemsCount = cartQuery?.data?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
    const cartSubtotal = cartQuery?.data?.subtotal ?? 0;
    const restaurantId = cartQuery?.data?.restaurantId;

    if (cartItemsCount === 0) return null;

    const mockRestaurant = restaurantId ? MOCK_RESTAURANTS.find((r: any) => r.id === restaurantId) : null;
    const restaurantName = mockRestaurant?.name ?? 'Selected Restaurant';

    return (
        <Pressable
            onPress={() => navigation.navigate('Cart')}
            style={({ pressed }) => ({
                position: 'absolute',
                bottom: tokens.spacing.lg + 10,
                left: tokens.spacing.md,
                right: tokens.spacing.md,
                borderRadius: 24,
                overflow: 'hidden',
                shadowColor: '#14532D',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
                elevation: 8,
                opacity: pressed ? 0.95 : 1,
            })}
        >
            <LinearGradient
                colors={['#0F3E22', '#14532D', '#166534']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: tokens.spacing.lg,
                    paddingVertical: tokens.spacing.md + 2,
                    borderWidth: 1.5,
                    borderColor: '#FCD34D',
                    borderRadius: 24,
                }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                        backgroundColor: '#FCD34D',
                        borderRadius: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 1,
                    }}>
                        <Text variant="label" style={{ color: '#134E4A', fontWeight: '900', fontSize: 13 }}>
                            {cartItemsCount} {cartItemsCount === 1 ? 'ITEM' : 'ITEMS'}
                        </Text>
                    </View>
                    <View style={{ flexShrink: 1 }}>
                        <Text variant="bodySmall" color="#FFFFFF" style={{ fontWeight: '900', fontSize: 16 }}>
                            ₹{formatMoney(cartSubtotal)}
                        </Text>
                        <Text variant="caption" style={{ color: '#E8F5E9', fontWeight: '600', fontSize: 11, marginTop: 1 }} numberOfLines={1}>
                            From {restaurantName}
                        </Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <Text variant="label" style={{ color: '#FCD34D', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>
                        View Cart
                    </Text>
                    <Feather name="arrow-right" size={16} color="#FCD34D" />
                </View>
            </LinearGradient>
        </Pressable>
    );
}
