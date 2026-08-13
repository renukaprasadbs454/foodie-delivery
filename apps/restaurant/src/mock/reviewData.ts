import type { RestaurantReview } from '../features/reviews/types';

export type ExtendedRestaurantReview = RestaurantReview & {
  reviewId: string;
  customerName: string;
  verified: boolean;
  orderInfo: string;
  itemInfo: string;
};

export const MOCK_REVIEWS: ExtendedRestaurantReview[] = [
  {
    reviewId: 'r-101',
    customerName: 'Siddharth Rao',
    restaurantRating: 5,
    deliveryRating: 5,
    comment:
      'The Hyderabadi Biryani was authentic and mouth-watering! Fast delivery and steaming hot packaging.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    orderInfo: '#ORD-2026-0801',
    itemInfo: 'Hyderabadi Dum Biryani & Mango Lassi',
    verified: true,
  },
  {
    reviewId: 'r-102',
    customerName: 'Meera Krishnan',
    restaurantRating: 5,
    deliveryRating: 5,
    comment:
      'Butter Chicken and Garlic Naan combo is top-notch. Soft naans and rich, creamy gravy!',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    orderInfo: '#ORD-2026-0802',
    itemInfo: 'Butter Chicken Boneless, Garlic Naan',
    verified: true,
  },
  {
    reviewId: 'r-103',
    customerName: 'Aarav Mehta',
    restaurantRating: 4,
    deliveryRating: 4,
    comment:
      'Paneer Tikka was smoky and spiced perfectly. Rasmalai was fresh, sweet and loaded with saffron.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    orderInfo: '#ORD-2026-0803',
    itemInfo: 'Paneer Tikka Tandoori, Rasmalai',
    verified: true,
  },
  {
    reviewId: 'r-104',
    customerName: 'Deepa Nair',
    restaurantRating: 5,
    deliveryRating: 5,
    comment:
      'Great portions and rich authentic taste. Dal Makhani was cooked perfectly overnight.',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    orderInfo: '#ORD-2026-0805',
    itemInfo: 'Dal Makhani Special & Paneer Butter Masala',
    verified: true,
  },
  {
    reviewId: 'r-105',
    customerName: 'Rohan Kapoor',
    restaurantRating: 4,
    deliveryRating: 4,
    comment:
      'Reshmi Kebabs were melt-in-mouth soft. Will definitely reorder from Foodie Restaurant!',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    orderInfo: '#ORD-2026-0804',
    itemInfo: 'Chicken Reshmi Kebab',
    verified: true,
  },
  {
    reviewId: 'r-106',
    customerName: 'Pooja Hegde',
    restaurantRating: 3,
    deliveryRating: 3,
    comment:
      'Food quality was decent, but delivery took a bit longer than expected during peak dinner hours.',
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    orderInfo: '#ORD-2026-0806',
    itemInfo: 'Special Veg Paneer Biryani',
    verified: true,
  },
];
