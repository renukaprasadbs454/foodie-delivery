import type { RestaurantPublicProfile } from './types';
import type { FullMenu, MenuItem } from '../menu/types';

export const CATEGORY_ITEMS = [
    { name: 'All', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80', cuisine: undefined },
    { name: 'Biriyani', image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400&q=80', cuisine: 'Biriyani' },
    { name: 'Dosa', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80', cuisine: 'Dosa' },
    { name: 'South Indian', image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=400&q=80', cuisine: 'South Indian' },
    { name: 'Rice', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=400&q=80', cuisine: 'Rice' },
    { name: 'Chicken', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80', cuisine: 'Chicken' },
    { name: 'Burger', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&q=80', cuisine: 'Burger' },
    { name: 'North Indian', image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&q=80', cuisine: 'North Indian' },
];

export const MOCK_RESTAURANTS: RestaurantPublicProfile[] = [
    {
        id: 'mock-resto-1',
        name: 'Deccan Biriyani House',
        description: 'Authentic Hyderabadi dum biriyani cooked with select spices and basmati rice.',
        cuisineTypes: ['Biriyani', 'North Indian'],
        avgRating: 4.8,
        ratingCount: 1540,
        imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
        city: 'BENGALURU',
        addressLine: 'MG Road, Bengaluru',
        phoneNumber: '+919686753394',
        status: 'ACTIVE',
        latitude: 12.9710,
        longitude: 77.5940,
    },
    {
        id: 'mock-resto-2',
        name: 'Hotel Udupi Vaibhav',
        description: 'Crispy ghee roast, soft idlis, and hot filter coffee. A paradise for vegetarian food lovers.',
        cuisineTypes: ['Dosa', 'South Indian'],
        avgRating: 4.5,
        ratingCount: 2200,
        imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80',
        city: 'BENGALURU',
        addressLine: 'Siddaganga Extension',
        phoneNumber: '+919686753394',
        status: 'ACTIVE',
        latitude: 12.9780,
        longitude: 77.5910,
    },
    {
        id: 'mock-resto-3',
        name: 'Al-Baik Chicken Palace',
        description: 'Crispy fried chicken fillets, grilled wings, and standard fresh garlic dips.',
        cuisineTypes: ['Chicken', 'Burger'],
        avgRating: 4.3,
        ratingCount: 880,
        imageUrl: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&q=80',
        city: 'BENGALURU',
        addressLine: 'SS Puram Main Road',
        phoneNumber: '+919686753394',
        status: 'ACTIVE',
        latitude: 12.9650,
        longitude: 77.5890,
    },
    {
        id: 'mock-resto-4',
        name: 'The Burger Club',
        description: 'Premium grilled chicken burgers, beef-like double cheese patties, and salted curly fries.',
        cuisineTypes: ['Burger', 'Chicken'],
        avgRating: 4.6,
        ratingCount: 1200,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
        city: 'BENGALURU',
        addressLine: 'Ashoka Road',
        phoneNumber: '+919686753394',
        status: 'ACTIVE',
        latitude: 12.9820,
        longitude: 77.6010,
    },
    {
        id: 'mock-resto-5',
        name: 'Punjab Grill & Curry',
        description: 'Creamy butter chicken, garlic naans, and delicious subcontinental recipes.',
        cuisineTypes: ['North Indian', 'Rice'],
        avgRating: 4.7,
        ratingCount: 940,
        imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=600&q=80',
        city: 'BENGALURU',
        addressLine: 'BH Road',
        phoneNumber: '+919686753394',
        status: 'ACTIVE',
        latitude: 12.9900,
        longitude: 77.5750,
    },
    {
        id: 'mock-resto-6',
        name: 'Imperial South Diner',
        description: 'Traditional Kerala parity meals, egg hoppers, parottas, and roasted chicken dishes.',
        cuisineTypes: ['South Indian', 'Rice'],
        avgRating: 4.4,
        ratingCount: 1100,
        imageUrl: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&q=80',
        city: 'BENGALURU',
        addressLine: 'Kyathsandra',
        phoneNumber: '+919686753394',
        status: 'ACTIVE',
        latitude: 12.9550,
        longitude: 77.6150,
    },
    {
        id: 'mock-resto-7',
        name: 'Biriyani Zone',
        description: 'Delicious egg and chicken dum biriyanis cooked in traditional handis.',
        cuisineTypes: ['Biriyani', 'Rice'],
        avgRating: 4.4,
        ratingCount: 750,
        imageUrl: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=600&q=80',
        city: 'BENGALURU',
        addressLine: 'Sharavathi Nagar',
        phoneNumber: '+919686753394',
        status: 'ACTIVE',
        latitude: 12.9400,
        longitude: 77.5650,
    },
    {
        id: 'mock-resto-8',
        name: 'Dosa Camp',
        description: 'Crispy dosas with spicy chutneys.',
        cuisineTypes: ['Dosa', 'South Indian'],
        avgRating: 4.2,
        ratingCount: 500,
        imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&q=80',
        city: 'BENGALURU',
        addressLine: 'Kuvempu Nagar',
        phoneNumber: '+919686753394',
        status: 'ACTIVE',
        latitude: 12.9200,
        longitude: 77.6255,
    },
    {
        id: 'mock-resto-9',
        name: 'Empire Restaurant',
        description: 'Late night cravings solved with ghee rice, kebabs and shawarmas.',
        cuisineTypes: ['North Indian', 'Biriyani', 'Chicken'],
        avgRating: 4.5,
        ratingCount: 3100,
        imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80',
        city: 'BENGALURU',
        addressLine: 'Bengaluru Main',
        phoneNumber: '+919686753394',
        status: 'ACTIVE',
        latitude: 13.0100,
        longitude: 77.5550,
    },
    {
        id: 'mock-resto-10',
        name: 'Sri Krishna Sweets & Bakery',
        description: 'Fresh sweets, puffs, and evening snacks.',
        cuisineTypes: ['South Indian'],
        avgRating: 4.1,
        ratingCount: 400,
        imageUrl: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&q=80',
        city: 'BENGALURU',
        addressLine: 'Church Road',
        phoneNumber: '+919686753394',
        status: 'ACTIVE',
        latitude: 12.8900,
        longitude: 77.6400,
    }
];

export const MOCK_MENUS: Record<string, FullMenu> = {};

const generateItems = (rId: string) => {
    const shift = parseInt(rId.split('-').pop() || '0');
    const b = (price: number) => (price + (shift * 10)).toFixed(2);
    return [
        {
            menuItemId: `${rId}-item-1`,
            restaurantId: rId,
            categoryId: 'cat-biriyani',
            categoryName: 'Signature Biriyanis',
            name: 'Hyderabadi Chicken Dum Biriyani',
            description: 'Highly Reordered. Tender chicken, aromatic basmati rice, layered and cooked on dum.',
            basePrice: b(280),
            isVeg: false,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=200',
            variants: []
        },
        {
            menuItemId: `${rId}-item-2`,
            restaurantId: rId,
            categoryId: 'cat-biriyani',
            categoryName: 'Signature Biriyanis',
            name: 'Special Egg Dum Biriyani',
            description: 'Fragrant dum rice served with 2 hard boiled spiced eggs and rich gravy.',
            basePrice: b(220),
            isVeg: false,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=200',
            variants: []
        },
        {
            menuItemId: `${rId}-item-3`,
            restaurantId: rId,
            categoryId: 'cat-biriyani',
            categoryName: 'Signature Biriyanis',
            name: 'Paneer Makhani Dum Biriyani',
            description: 'Juicy paneer cubes marinated in spices, layered with fluffy basmati rice.',
            basePrice: b(240),
            isVeg: true,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?q=80&w=200',
            variants: []
        },
        {
            menuItemId: `${rId}-item-4`,
            restaurantId: rId,
            categoryId: 'cat-dosa',
            categoryName: 'Dosa & Tiffins',
            name: 'Ghee Roast Masala Dosa',
            description: 'Crispy dosa roasted in pure ghee, served with aloo masala and chutneys.',
            basePrice: b(120),
            isVeg: true,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?q=80&w=200',
            variants: []
        },
        {
            menuItemId: `${rId}-item-5`,
            restaurantId: rId,
            categoryId: 'cat-dosa',
            categoryName: 'Dosa & Tiffins',
            name: 'Onion Rava Dosa',
            description: 'Thin crispy rava dosa embedded with chopped onions and coriander.',
            basePrice: b(110),
            isVeg: true,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f39ce9b0?q=80&w=200',
            variants: []
        },
        {
            menuItemId: `${rId}-item-6`,
            restaurantId: rId,
            categoryId: 'cat-chicken',
            categoryName: 'Starters',
            name: 'Chicken Kebab (Boneless)',
            description: 'Crispy south-indian style fried chicken pieces tossed in curry leaves.',
            basePrice: b(190),
            isVeg: false,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?q=80&w=200',
            variants: []
        },
        {
            menuItemId: `${rId}-item-7`,
            restaurantId: rId,
            categoryId: 'cat-chicken',
            categoryName: 'Starters',
            name: 'Guntur Chicken Dry',
            description: 'Spicy chicken roasted with original Guntur chilies.',
            basePrice: b(210),
            isVeg: false,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1599487405270-86430afbe166?q=80&w=200',
            variants: []
        },
        {
            menuItemId: `${rId}-item-8`,
            restaurantId: rId,
            categoryId: 'cat-north',
            categoryName: 'North Indian Curries',
            name: 'Butter Chicken Masala',
            description: 'Rich, creamy and slightly sweet chicken curry, best had with naan.',
            basePrice: b(250),
            isVeg: false,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=200',
            variants: []
        },
        {
            menuItemId: `${rId}-item-9`,
            restaurantId: rId,
            categoryId: 'cat-north',
            categoryName: 'North Indian Curries',
            name: 'Kadai Paneer',
            description: 'Spicy paneer curry cooked with bell peppers and whole spices.',
            basePrice: b(220),
            isVeg: true,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a8fc?q=80&w=200',
            variants: []
        },
        {
            menuItemId: `${rId}-item-10`,
            restaurantId: rId,
            categoryId: 'cat-burger',
            categoryName: 'Fast Food',
            name: 'Juicy Lucy Chicken Burger',
            description: 'Double chicken patty stuffed with melting cheese inside soft buns.',
            basePrice: b(180),
            isVeg: false,
            isAvailable: true,
            imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200',
            variants: []
        }
    ];
};

for (const rest of MOCK_RESTAURANTS) {
    const items = generateItems(rest.id);
    const cTypes = rest.cuisineTypes || [];
    const isBiriyani = cTypes.includes('Biriyani') || cTypes.includes('Rice');
    const isDosa = cTypes.includes('Dosa') || cTypes.includes('South Indian');
    const isChicken = cTypes.includes('Chicken');
    const isNorth = cTypes.includes('North Indian');
    const isBurger = cTypes.includes('Burger');

    const cats = [];
    if (isBiriyani) { cats.push({ categoryId: 'cat-biriyani', name: 'Signature Biriyanis', displayOrder: 0, items: items.slice(0, 3) }); }
    if (isDosa || (!isBiriyani && !isChicken && !isNorth && !isBurger)) { cats.push({ categoryId: 'cat-dosa', name: 'Dosa & Tiffins', displayOrder: 1, items: items.slice(3, 5) }); }
    if (isChicken) { cats.push({ categoryId: 'cat-chicken', name: 'Starters', displayOrder: 2, items: items.slice(5, 7) }); }
    if (isNorth) { cats.push({ categoryId: 'cat-north', name: 'North Indian Curries', displayOrder: 3, items: items.slice(7, 9) }); }
    if (isBurger) { cats.push({ categoryId: 'cat-burger', name: 'Fast Food', displayOrder: 4, items: items.slice(9, 10) }); }

    MOCK_MENUS[rest.id] = {
        restaurantId: rest.id,
        categories: cats
    };
}
