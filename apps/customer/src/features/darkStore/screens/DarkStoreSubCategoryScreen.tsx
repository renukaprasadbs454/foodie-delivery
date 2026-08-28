import React from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BrowseStackParamList } from '../../../navigation/types';

// Mock Subcategories based on Category ID
const MOCK_SUBCATEGORIES: Record<string, any[]> = {
    cat1: [
        { id: 'sub1', name: 'Fresh Vegetables', image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=300&q=80' },
        { id: 'sub2', name: 'Fresh Fruits', image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80' },
        { id: 'sub3', name: 'Dairy, Bread & Eggs', image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=300&q=80' },
        { id: 'sub4', name: 'Meat & Seafood', image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&w=300&q=80' },
    ],
    cat2: [
        { id: 'sub5', name: 'Rice & Grains', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80' },
        { id: 'sub6', name: 'Spices & Masalas', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&q=80' },
    ]
};

type Props = NativeStackScreenProps<BrowseStackParamList, 'DarkStoreSubCategory'>;

export function DarkStoreSubCategoryScreen({ navigation, route }: Props) {
    const { categoryId, categoryName } = route.params;
    const subcategories = MOCK_SUBCATEGORIES[categoryId] || MOCK_SUBCATEGORIES['cat1'];

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.headerContainer}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle}>{categoryName}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.gridContainer}>
                    {subcategories.map(sub => (
                        <Pressable
                            key={sub.id}
                            style={({ pressed }) => [styles.subCategoryCard, { opacity: pressed ? 0.8 : 1 }]}
                            onPress={() => navigation.navigate('DarkStoreItems', { subcategoryId: sub.id, subcategoryName: sub.name })}
                        >
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: sub.image }} style={styles.subImage} />
                            </View>
                            <Text style={styles.subCategoryName}>{sub.name}</Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#14532D',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    },
    backButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    headerTitle: {
        color: '#FCD34D',
        fontWeight: '800',
        fontSize: 18,
    },
    scrollContent: {
        padding: 16,
        backgroundColor: '#F9FAFB',
        flexGrow: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    subCategoryCard: {
        width: '48%',
        marginBottom: 20,
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        overflow: 'hidden',
    },
    imageContainer: {
        width: '100%',
        height: 120,
        backgroundColor: '#E5E7EB',
        marginBottom: 8,
    },
    subImage: {
        width: '100%',
        height: '100%',
    },
    subCategoryName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
        paddingHorizontal: 8,
    }
});
