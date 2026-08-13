import type { RestaurantDetail } from '../features/onboarding/types';
import { MOCK_CONFIG } from '../config/mockConfig';

export type MockRestaurantProfile = RestaurantDetail & {
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  isOpen: boolean;
};

export const MOCK_RESTAURANT_PROFILE: MockRestaurantProfile = {
  restaurantId: MOCK_CONFIG.DEFAULT_MOCK_RESTAURANT_ID,
  name: 'Foodie Restaurant',
  description:
    'Authentic Indian dining experience featuring rich biryanis, aromatic curries, sizzling tandoori starters, and refreshing beverages.',
  cuisineTypes: [
    'BIRYANI',
    'NORTH_INDIAN',
    'MUGHLAI',
    'SOUTH_INDIAN',
    'DESSERTS',
    'BEVERAGES',
  ],
  phone: '+91 98765 43210',
  email: 'contact@foodierestaurant.com',
  address: {
    line1: '124 MG Road, Opposite Metro Station',
    line2: 'Koramangala 5th Block',
    city: 'Bengaluru',
    pincode: '560095',
    latitude: 12.9352,
    longitude: 77.6245,
  },
  openingTime: '11:00 AM',
  closingTime: '11:00 PM',
  status: 'APPROVED',
  isOpen: true,
  logoImageUrl:
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
  coverImageUrl:
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
  avgRating: 4.8,
  commissionPct: 15,
};
