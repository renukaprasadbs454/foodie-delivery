import React from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrowseStackParamList } from '../../../navigation/types';

const DARK_STORE_SECTIONS = [
    {
        title: 'Fresh items',
        items: [
            { id: 'sub1', name: 'Fresh Vegetables', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=150&q=80' },
            { id: 'sub2', name: 'Fresh Fruits', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=150&q=80' },
            { id: 'sub3', name: 'Dairy, Bread and Eggs', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=150&q=80' },
            { id: 'sub4', name: 'Meat and Seafood', image: 'https://images.unsplash.com/photo-1607623814075-e51df1bd682f?auto=format&fit=crop&w=150&q=80' },
        ]
    },
    {
        title: 'Grocery & Kitchen',
        items: [
            { id: 'sub5', name: 'Atta, Rice and Dal', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=150&q=80' },
            { id: 'sub6', name: 'Masalas', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=150&q=80' },
            { id: 'sub7', name: 'Oils and Ghee', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=150&q=80' },
            { id: 'sub8', name: 'Cereals and Breakfast', image: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=150&q=80' },
        ]
    },
    {
        title: 'Snacks & drinks',
        items: [
            { id: 'sub9', name: 'Cold Drinks and Juices', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=150&q=80' },
            { id: 'sub10', name: 'Ice Creams', image: 'https://images.unsplash.com/photo-1557142046-c704a3adf364?auto=format&fit=crop&w=150&q=80' },
            { id: 'sub11', name: 'Chips and Namkeens', image: 'https://images.unsplash.com/photo-1566478989037-eade38d1c25f?auto=format&fit=crop&w=150&q=80' },
            { id: 'sub12', name: 'Chocolates', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=150&q=80' },
        ]
    }
];

type Props = NativeStackScreenProps<BrowseStackParamList, 'DarkStore'>;

export function DarkStoreScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.headerTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>←</Text>
                    </Pressable>
                    <Text style={styles.headerTitle}>DARK STORE</Text>
                </View>
                <View style={styles.searchIconContainer}>
                    <Text style={{ fontSize: 18 }}>🔍</Text>
                </View>
            </View>

            {/* Mock Address */}
            <View style={styles.addressContainer}>
                <Text style={styles.deliveringToText}>DELIVERING TO</Text>
                <Text style={styles.addressText}>Your Saved Address, City...</Text>
            </View>

            {/* Search Bar - Clickable */}
            <Pressable onPress={() => (navigation as any).navigate('DarkStoreSearch')} style={styles.searchBar}>
                <Text style={{ marginRight: 8, fontSize: 16 }}>🔍</Text>
                <Text style={styles.searchPlaceholder}>Search for groceries, essentials...</Text>
            </Pressable>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {renderHeader()}
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {DARK_STORE_SECTIONS.map((section, idx) => (
                    <View key={idx} style={{ marginBottom: 24 }}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <View style={styles.gridContainer}>
                            {section.items.map(subItem => (
                                <Pressable
                                    key={subItem.id}
                                    style={({ pressed }) => [styles.categoryCard, { opacity: pressed ? 0.8 : 1 }]}
                                    onPress={() => navigation.navigate('DarkStoreItems', { subcategoryId: subItem.id, subcategoryName: subItem.name })}
                                >
                                    <View style={styles.imageBackground}>
                                        <Image source={{ uri: subItem.image }} style={styles.categoryImage} />
                                    </View>
                                    <Text style={styles.categoryNameText} numberOfLines={2}>
                                        {subItem.name}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Floating Free Delivery Bar */}
            <View style={styles.floatingBannerContainer}>
                <View style={styles.floatingBanner}>
                    <Text style={styles.floatingBannerText}>
                        <Text style={{ fontWeight: '800' }}>FREE DELIVERY</Text> on orders above ₹99
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#14532D', // Primary Dark Green
    },
    headerContainer: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
        backgroundColor: '#14532D',
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
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
    headerTitle: {
        color: '#FCD34D',
        fontWeight: '900',
        fontSize: 18,
        letterSpacing: -0.5,
    },
    searchIconContainer: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    addressContainer: {
        marginBottom: 16,
    },
    deliveringToText: {
        fontSize: 12,
        color: '#A7F3D0',
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    addressText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        marginTop: 2,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    searchPlaceholder: {
        color: '#6B7280',
        fontWeight: '500',
        fontSize: 14,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 80, // for floating banner
        backgroundColor: '#FFFFFF',
        flexGrow: 1,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#374151',
        marginBottom: 16,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryCard: {
        width: '23%', // 4 columns layout
        marginBottom: 16,
        alignItems: 'center',
    },
    imageBackground: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#EFF6FF', // Light blue box like Instamart screenshot
        borderRadius: 16,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryImage: {
        width: '80%',
        height: '80%',
        resizeMode: 'contain',
    },
    categoryNameText: {
        color: '#4B5563',
        fontWeight: '700',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 14,
    },
    floatingBannerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 0,
        paddingBottom: 0,
    },
    floatingBanner: {
        backgroundColor: '#E0F2FE', // Light blue banner at bottom
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    floatingBannerText: {
        color: '#0F172A',
        fontSize: 13,
        fontWeight: '600'
    }
});
