import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const ALL_MOCK_ITEMS = [
    { id: 'item-1', name: 'Farm Fresh Tomato', price: 40, weight: '500g', image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=300&q=80' },
    { id: 'item-2', name: 'Organic Potato', price: 35, weight: '1 kg', image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300&q=80' },
    { id: 'item-3', name: 'Aashirvaad Whole Wheat Atta', price: 250, weight: '5 kg', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80' },
    { id: 'item-4', name: 'Fortune Sunlite Refined Oil', price: 145, weight: '1 L', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80' },
    { id: 'item-5', name: 'Amul Taaza Milk', price: 30, weight: '500 ml', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=300&q=80' },
    { id: 'item-6', name: 'Britannia Bread', price: 45, weight: '400g', image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=300&q=80' },
    { id: 'item-7', name: 'Lays India\'s Magic Masala', price: 20, weight: '50g', image: 'https://images.unsplash.com/photo-1566478989037-eade38d1c25f?w=300&q=80' },
    { id: 'item-8', name: 'Coca Cola', price: 40, weight: '750 ml', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80' },
];

const RECOMMENDED_SEARCHES = ['Milk', 'Bread', 'Eggs', 'Potato', 'Onion', 'Tomato', 'Atta', 'Chips'];

export function DarkStoreSearchScreen({ navigation }: any) {
    const [query, setQuery] = useState('');
    const [mockCartItems, setMockCartItems] = useState<any[]>([]);

    const filteredItems = useMemo(() => {
        if (!query.trim()) return [];
        return ALL_MOCK_ITEMS.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
    }, [query]);

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
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </Pressable>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for groceries, essentials..."
                    placeholderTextColor="#9ca3af"
                    value={query}
                    onChangeText={setQuery}
                    autoFocus={true}
                />
                {query.length > 0 && (
                    <Pressable onPress={() => setQuery('')} style={styles.clearButton}>
                        <Feather name="x" size={18} color="#9ca3af" />
                    </Pressable>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {query.trim() === '' ? (
                    <View style={styles.recommendedContainer}>
                        <Text style={styles.sectionTitle}>Trending Searches</Text>
                        <View style={styles.chipsContainer}>
                            {RECOMMENDED_SEARCHES.map((searchQuery, idx) => (
                                <Pressable
                                    key={idx}
                                    style={styles.chip}
                                    onPress={() => setQuery(searchQuery)}
                                >
                                    <Feather name="trending-up" size={12} color="#14532D" style={{ marginRight: 6 }} />
                                    <Text style={styles.chipText}>{searchQuery}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Fresh Recommendations</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
                            <View style={{ width: 16 }} />
                            {ALL_MOCK_ITEMS.slice(0, 5).map((item) => (
                                <View key={item.id} style={styles.horizontalCard}>
                                    <Image source={{ uri: item.image }} style={styles.horizontalImage} />
                                    <View style={{ padding: 12 }}>
                                        <Text style={styles.horizontalItemName} numberOfLines={1}>{item.name}</Text>
                                        <Text style={styles.itemWeight}>{item.weight}</Text>
                                        <View style={styles.horizontalPriceRow}>
                                            <Text style={styles.itemPrice}>₹{item.price}</Text>
                                            <Pressable onPress={() => handleAddToCart(item)} style={styles.addButtonSmall}>
                                                <Text style={styles.addButtonTextSmall}>ADD</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                </View>
                            ))}
                            <View style={{ width: 16 }} />
                        </ScrollView>
                    </View>
                ) : filteredItems.length > 0 ? (
                    <View style={styles.resultsContainer}>
                        {filteredItems.map(item => (
                            <View key={item.id} style={styles.itemCard}>
                                <Image source={{ uri: item.image }} style={styles.itemImage} />
                                <View style={styles.itemDetails}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemWeight}>{item.weight}</Text>
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
                    </View>
                ) : (
                    <View style={styles.noResultsContainer}>
                        <Text style={{ fontSize: 48, marginBottom: 16 }}>🔍</Text>
                        <Text style={styles.noResultsTitle}>No results found</Text>
                        <Text style={styles.noResultsText}>We couldn't find anything for "{query}"</Text>
                    </View>
                )}
            </ScrollView>

            {/* Simulated Global Cart Banner */}
            {cartCount > 0 && (
                <Pressable
                    onPress={() => navigation.navigate('Cart', { mockItems: mockCartItems })}
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
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ color: '#FCD34D', fontWeight: '900', fontSize: 14 }}>
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
    safeArea: {
        flex: 1,
        backgroundColor: '#14532D',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#14532D',
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.25)',
        marginRight: 12,
    },
    backButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
    },
    clearButton: {
        position: 'absolute',
        right: 28,
        backgroundColor: '#f3f4f6',
        borderRadius: 12,
        padding: 4,
    },
    content: {
        padding: 16,
        paddingBottom: 90,
        backgroundColor: '#F9FAFB',
        flexGrow: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    recommendedContainer: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1f2937',
        marginBottom: 16,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fefeF2',
        borderWidth: 1,
        borderColor: '#FCD34D',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    chipText: {
        color: '#14532D',
        fontWeight: '700',
        fontSize: 13,
    },
    horizontalCard: {
        width: 140,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        overflow: 'hidden',
    },
    horizontalImage: {
        width: '100%',
        height: 100,
        backgroundColor: '#F3F4F6'
    },
    horizontalItemName: {
        fontWeight: '800',
        fontSize: 13,
        color: '#1f2937',
    },
    horizontalPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    addButtonSmall: {
        backgroundColor: '#FEF3C7',
        borderWidth: 1,
        borderColor: '#FCD34D',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    addButtonTextSmall: {
        color: '#14532D',
        fontWeight: '800',
        fontSize: 11,
    },
    resultsContainer: {
        flex: 1,
    },
    itemCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    itemImage: {
        width: 90,
        height: 90,
        borderRadius: 12,
        backgroundColor: '#E5E7EB',
    },
    itemDetails: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    itemName: { fontSize: 16, fontWeight: '800', color: '#111827' },
    itemWeight: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 2 },
    priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
    itemPrice: { fontSize: 16, fontWeight: '900', color: '#14532D' },
    addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#FCD34D' },
    addButtonText: { color: '#14532D', fontWeight: '800', fontSize: 13, marginRight: 4 },
    addPlusContainer: { backgroundColor: '#14532D', borderRadius: 4, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
    addPlusText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', lineHeight: 14 },
    noResultsContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    noResultsTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1f2937',
        marginBottom: 8,
    },
    noResultsText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
    }
});
