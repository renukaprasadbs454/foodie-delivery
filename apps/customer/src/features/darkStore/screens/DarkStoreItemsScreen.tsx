import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrowseStackParamList } from '../../../navigation/types';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

const MOCK_ITEMS = Array.from({ length: 10 }).map((_, i) => ({
    id: `ds-item-${i}`,
    name: ['Farm Fresh Tomato', 'Organic Potato', 'Green Capsicum', 'Crispy Onion', 'Fresh Cauliflower', 'Broccoli', 'Green Chilli', 'Coriander', 'Lemon', 'Carrot'][i % 10],
    image: [
        'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=300&q=80',
        'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=300&q=80',
    ][i % 3],
    weight: ['500g', '1 kg', '250g', '300-400g', '500g'][i % 5],
    price: Math.floor(Math.random() * 50) + 20,
    rating: (Math.random() * 1 + 4).toFixed(1),
    reviews: Math.floor(Math.random() * 500) + 50,
}));

type Props = NativeStackScreenProps<BrowseStackParamList, 'DarkStoreItems'>;

export function DarkStoreItemsScreen({ navigation, route }: Props) {
    const { subcategoryName } = route.params;
    const [mockCartItems, setMockCartItems] = useState<any[]>([]);

    const handleAddToCart = (item: any) => {
        setMockCartItems(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const cartTotal = mockCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = mockCartItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.headerContainer}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle}>{subcategoryName}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {MOCK_ITEMS.map((item) => (
                    <View key={item.id} style={styles.itemCard}>
                        <View style={styles.imageContainer}>
                            <Image source={{ uri: item.image }} style={styles.itemImage} />
                        </View>
                        <View style={styles.itemDetails}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemWeight}>{item.weight}</Text>

                            <View style={styles.ratingContainer}>
                                <Text style={styles.starIcon}>★</Text>
                                <Text style={styles.ratingText}>{item.rating}</Text>
                                <Text style={styles.reviewsText}>({item.reviews})</Text>
                            </View>

                            <View style={styles.priceRow}>
                                <Text style={styles.itemPrice}>₹{item.price}</Text>
                                <Pressable
                                    style={({ pressed }) => [styles.addButton, { opacity: pressed ? 0.7 : 1 }]}
                                    onPress={() => handleAddToCart(item)}
                                >
                                    <Text style={styles.addButtonText}>ADD</Text>
                                    <View style={styles.addPlusContainer}>
                                        <Text style={styles.addPlusText}>+</Text>
                                    </View>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Simulated Global Cart Banner */}
            {cartCount > 0 && (
                <Pressable
                    onPress={() => (navigation as any).navigate('Cart', { mockItems: mockCartItems })}
                    style={({ pressed }) => ({
                        position: 'absolute',
                        bottom: 24,
                        left: 16,
                        right: 16,
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
                            paddingHorizontal: 24,
                            paddingVertical: 18,
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
                                <Text style={{ color: '#134E4A', fontWeight: '900', fontSize: 13 }}>
                                    {cartCount} {cartCount === 1 ? 'ITEM' : 'ITEMS'}
                                </Text>
                            </View>
                            <View style={{ flexShrink: 1 }}>
                                <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 16 }}>
                                    ₹{cartTotal.toFixed(2)}
                                </Text>
                                <Text style={{ color: '#E8F5E9', fontWeight: '600', fontSize: 11, marginTop: 1 }} numberOfLines={1}>
                                    From Dark Store
                                </Text>
                            </View>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <Text style={{ color: '#FCD34D', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>
                                View Cart
                            </Text>
                            <Feather name="arrow-right" size={16} color="#FCD34D" />
                        </View>
                    </LinearGradient>
                </Pressable>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#14532D' },
    headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#14532D' },
    backButton: { padding: 8, backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 20, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)' },
    backButtonText: { color: '#FFF', fontSize: 18, fontWeight: '800' },
    headerTitle: { color: '#FCD34D', fontWeight: '800', fontSize: 18 },
    scrollContent: { padding: 16, paddingBottom: 90, backgroundColor: '#F9FAFB', flexGrow: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    itemCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
    imageContainer: { width: 90, height: 90, borderRadius: 12, overflow: 'hidden', backgroundColor: '#E5E7EB' },
    itemImage: { width: '100%', height: '100%' },
    itemDetails: { flex: 1, marginLeft: 16, justifyContent: 'center' },
    itemName: { fontSize: 16, fontWeight: '800', color: '#111827' },
    itemWeight: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 2 },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    starIcon: { color: '#F59E0B', fontSize: 12, marginRight: 2 },
    ratingText: { fontSize: 12, fontWeight: '800', color: '#374151' },
    reviewsText: { fontSize: 12, color: '#9CA3AF', marginLeft: 4 },
    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    itemPrice: { fontSize: 16, fontWeight: '900', color: '#14532D' },
    addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FCD34D' },
    addButtonText: { color: '#14532D', fontWeight: '800', fontSize: 13, marginRight: 4 },
    addPlusContainer: { backgroundColor: '#14532D', borderRadius: 4, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
    addPlusText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', lineHeight: 14 }
});
