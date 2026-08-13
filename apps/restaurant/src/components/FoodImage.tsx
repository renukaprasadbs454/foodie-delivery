import React from 'react';
import { Image, ImageStyle, StyleProp, View } from 'react-native';

const DEFAULT_FOOD_IMAGES: Record<string, string> = {
  biryani:
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
  starter:
    'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&auto=format&fit=crop&q=80',
  chicken:
    'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80',
  paneer:
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
  curry:
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
  dessert:
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
  default:
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
};

export function resolveFoodImageUrl(url?: string | null, name?: string): string {
  if (url && url.trim().length > 0) return url;
  const nameLower = (name ?? '').toLowerCase();
  if (nameLower.includes('biryani')) return DEFAULT_FOOD_IMAGES.biryani;
  if (
    nameLower.includes('starter') ||
    nameLower.includes('tikka') ||
    nameLower.includes('kebab')
  )
    return DEFAULT_FOOD_IMAGES.starter;
  if (nameLower.includes('paneer')) return DEFAULT_FOOD_IMAGES.paneer;
  if (nameLower.includes('chicken') || nameLower.includes('meat'))
    return DEFAULT_FOOD_IMAGES.chicken;
  if (
    nameLower.includes('curry') ||
    nameLower.includes('dal') ||
    nameLower.includes('masala')
  )
    return DEFAULT_FOOD_IMAGES.curry;
  if (
    nameLower.includes('cake') ||
    nameLower.includes('sweet') ||
    nameLower.includes('ice')
  )
    return DEFAULT_FOOD_IMAGES.dessert;
  return DEFAULT_FOOD_IMAGES.default;
}

export type FoodImageProps = {
  url?: string | null;
  name?: string;
  style?: StyleProp<ImageStyle>;
  size?: number;
};

export function FoodImage({ url, name, style, size = 80 }: FoodImageProps) {
  const uri = resolveFoodImageUrl(url, name);
  return (
    <View style={[{ width: size, height: size, borderRadius: 12, overflow: 'hidden' }, style]}>
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </View>
  );
}
