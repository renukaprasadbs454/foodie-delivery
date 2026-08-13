import type { FullMenu, MenuCategory, MenuItem } from '../features/menu/types';
import { MOCK_CONFIG } from '../config/mockConfig';

export type ExtendedMenuItem = MenuItem & {
  category: string;
  categoryId: string;
  rating: number;
  preparationTime: string;
};

export const MOCK_CATEGORIES: MenuCategory[] = [
  {
    categoryId: 'c1111111-1111-4111-8111-111111111111',
    name: 'Biryani',
    displayOrder: 1,
    items: [
      {
        menuItemId: 'm1000001-0000-4000-8000-000000000001',
        name: 'Hyderabadi Dum Biryani',
        description:
          'Fragrant basmati rice cooked over slow dum with succulent marinated chicken and authentic Indian spices.',
        basePrice: 349,
        isVeg: false,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
        variants: [
          { variantId: 'v101-half', name: 'Half (Serves 1)', priceDelta: 0 },
          { variantId: 'v101-full', name: 'Full (Serves 2)', priceDelta: 120 },
        ],
        category: 'Biryani',
        categoryId: 'c1111111-1111-4111-8111-111111111111',
        rating: 4.9,
        preparationTime: '25 mins',
      } as ExtendedMenuItem,
      {
        menuItemId: 'm1000002-0000-4000-8000-000000000002',
        name: 'Special Veg Paneer Biryani',
        description:
          'Aromatic rice infused with saffron, cottage cheese cubes, caramelized onions and fresh mint leaves.',
        basePrice: 299,
        isVeg: true,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
        variants: [
          { variantId: 'v102-reg', name: 'Regular', priceDelta: 0 },
          { variantId: 'v102-large', name: 'Jumbo Pack', priceDelta: 90 },
        ],
        category: 'Biryani',
        categoryId: 'c1111111-1111-4111-8111-111111111111',
        rating: 4.7,
        preparationTime: '20 mins',
      } as ExtendedMenuItem,
      {
        menuItemId: 'm1000003-0000-4000-8000-000000000003',
        name: 'Mutton Dum Biryani',
        description:
          'Tender goat meat slow-cooked with basmati rice, aromatic kewra water, saffron and whole garam masala.',
        basePrice: 449,
        isVeg: false,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
        variants: [
          { variantId: 'v103-full', name: 'Full Plate', priceDelta: 0 },
          { variantId: 'v103-family', name: 'Family Bucket', priceDelta: 350 },
        ],
        category: 'Biryani',
        categoryId: 'c1111111-1111-4111-8111-111111111111',
        rating: 4.8,
        preparationTime: '30 mins',
      } as ExtendedMenuItem,
      {
        menuItemId: 'm1000015-0000-4000-8000-000000000015',
        name: 'Kolkata Egg Biryani',
        description:
          'Flavorful rice dish layered with boiled eggs, spiced potatoes, saffron, and subtle rose water essence.',
        basePrice: 249,
        isVeg: false,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
        variants: [],
        category: 'Biryani',
        categoryId: 'c1111111-1111-4111-8111-111111111111',
        rating: 4.6,
        preparationTime: '20 mins',
      } as ExtendedMenuItem,
    ],
  },
  {
    categoryId: 'c2222222-2222-4222-8222-222222222222',
    name: 'Starters',
    displayOrder: 2,
    items: [
      {
        menuItemId: 'm1000004-0000-4000-8000-000000000004',
        name: 'Paneer Tikka Tandoori',
        description:
          'Cubes of paneer marinated in spicy yogurt and roasted in a clay tandoor oven with bell peppers.',
        basePrice: 269,
        isVeg: true,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
        variants: [
          { variantId: 'v104-6pc', name: '6 Pieces', priceDelta: 0 },
          { variantId: 'v104-8pc', name: '8 Pieces', priceDelta: 60 },
        ],
        category: 'Starters',
        categoryId: 'c2222222-2222-4222-8222-222222222222',
        rating: 4.8,
        preparationTime: '15 mins',
      } as ExtendedMenuItem,
      {
        menuItemId: 'm1000005-0000-4000-8000-000000000005',
        name: 'Chicken 65 Sizzler',
        description:
          'Spicy deep-fried chicken tempered with curry leaves, green chillies, garlic and lemon juice.',
        basePrice: 319,
        isVeg: false,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=600&auto=format&fit=crop&q=80',
        variants: [],
        category: 'Starters',
        categoryId: 'c2222222-2222-4222-8222-222222222222',
        rating: 4.7,
        preparationTime: '18 mins',
      } as ExtendedMenuItem,
      {
        menuItemId: 'm1000006-0000-4000-8000-000000000006',
        name: 'Chicken Reshmi Kebab',
        description:
          'Silky minced chicken skewers seasoned with cream, cashew paste, white pepper and char-grilled.',
        basePrice: 329,
        isVeg: false,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80',
        variants: [
          { variantId: 'v106-half', name: '4 Pieces', priceDelta: 0 },
          { variantId: 'v106-full', name: '8 Pieces', priceDelta: 130 },
        ],
        category: 'Starters',
        categoryId: 'c2222222-2222-4222-8222-222222222222',
        rating: 4.9,
        preparationTime: '18 mins',
      } as ExtendedMenuItem,
      {
        menuItemId: 'm1000016-0000-4000-8000-000000000016',
        name: 'Crispy Corn Pepper Fry',
        description:
          'Sweet corn kernels tossed with crushed black pepper, spring onions, capsicum, and oriental spices.',
        basePrice: 219,
        isVeg: true,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
        variants: [],
        category: 'Starters',
        categoryId: 'c2222222-2222-4222-8222-222222222222',
        rating: 4.6,
        preparationTime: '12 mins',
      } as ExtendedMenuItem,
    ],
  },
  {
    categoryId: 'c3333333-3333-4333-8333-333333333333',
    name: 'Main Course',
    displayOrder: 3,
    items: [
      {
        menuItemId: 'm1000007-0000-4000-8000-000000000007',
        name: 'Butter Chicken Boneless',
        description:
          'Tender grilled chicken pieces simmered in a velvety tomato, butter, and cashew nut gravy.',
        basePrice: 389,
        isVeg: false,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=600&auto=format&fit=crop&q=80',
        variants: [
          { variantId: 'v107-half', name: 'Half Portion', priceDelta: 0 },
          { variantId: 'v107-full', name: 'Full Portion', priceDelta: 110 },
        ],
        category: 'Main Course',
        categoryId: 'c3333333-3333-4333-8333-333333333333',
        rating: 4.9,
        preparationTime: '20 mins',
      } as ExtendedMenuItem,
      {
        menuItemId: 'm1000008-0000-4000-8000-000000000008',
        name: 'Dal Makhani Special',
        description:
          'Whole black lentils slow-cooked overnight with white butter, cream, and subtle tandoori spices.',
        basePrice: 279,
        isVeg: true,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
        variants: [],
        category: 'Main Course',
        categoryId: 'c3333333-3333-4333-8333-333333333333',
        rating: 4.8,
        preparationTime: '15 mins',
      } as ExtendedMenuItem,
      {
        menuItemId: 'm1000009-0000-4000-8000-000000000009',
        name: 'Paneer Butter Masala',
        description:
          'Fresh cottage cheese cooked in a rich, mild, and creamy tomato onion gravy with kasuri methi.',
        basePrice: 319,
        isVeg: true,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
        variants: [
          { variantId: 'v109-half', name: 'Half', priceDelta: 0 },
          { variantId: 'v109-full', name: 'Full', priceDelta: 90 },
        ],
        category: 'Main Course',
        categoryId: 'c3333333-3333-4333-8333-333333333333',
        rating: 4.7,
        preparationTime: '15 mins',
      } as ExtendedMenuItem,
      {
        menuItemId: 'm1000010-0000-4000-8000-000000000010',
        name: 'Butter Garlic Naan',
        description:
          'Leavened flatbread topped with minced garlic and fresh coriander, baked fresh in the clay oven.',
        basePrice: 60,
        isVeg: true,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop&q=80',
        variants: [
          { variantId: 'v110-plain', name: 'Butter', priceDelta: 0 },
          { variantId: 'v110-cheese', name: 'Cheese Stuffed', priceDelta: 30 },
        ],
        category: 'Main Course',
        categoryId: 'c3333333-3333-4333-8333-333333333333',
        rating: 4.8,
        preparationTime: '8 mins',
      } as ExtendedMenuItem,
      {
        menuItemId: 'm1000017-0000-4000-8000-000000000017',
        name: 'Kadhai Paneer Dhaba Style',
        description:
          'Cottage cheese cooked with freshly ground kadhai masala, diced onions, bell peppers and coriander.',
        basePrice: 309,
        isVeg: true,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop&q=80',
        variants: [],
        category: 'Main Course',
        categoryId: 'c3333333-3333-4333-8333-333333333333',
        rating: 4.8,
        preparationTime: '15 mins',
      } as ExtendedMenuItem,
    ],
  },
  {
    categoryId: 'c4444444-4444-4444-8444-444444444444',
    name: 'Desserts',
    displayOrder: 4,
    items: [
      {
        menuItemId: 'm1000011-0000-4000-8000-000000000011',
        name: 'Gulab Jamun with Rabri',
        description:
          'Warm soft fried milk dumplings soaked in cardamom sugar syrup, topped with thick condensed rabri.',
        basePrice: 149,
        isVeg: true,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
        variants: [
          { variantId: 'v111-2pc', name: '2 Pieces', priceDelta: 0 },
          { variantId: 'v111-4pc', name: '4 Pieces', priceDelta: 70 },
        ],
        category: 'Desserts',
        categoryId: 'c4444444-4444-4444-8444-444444444444',
        rating: 4.9,
        preparationTime: '5 mins',
      } as ExtendedMenuItem,
      {
        menuItemId: 'm1000012-0000-4000-8000-000000000012',
        name: 'Royal Kesari Rasmalai',
        description:
          'Soft chenna discs soaked in saffron-infused chilled milk, garnished with pistachios and almond flakes.',
        basePrice: 169,
        isVeg: true,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
        variants: [],
        category: 'Desserts',
        categoryId: 'c4444444-4444-4444-8444-444444444444',
        rating: 4.8,
        preparationTime: '5 mins',
      } as ExtendedMenuItem,
      {
        menuItemId: 'm1000018-0000-4000-8000-000000000018',
        name: 'Shahi Gajar Ka Halwa',
        description:
          'Classic winter dessert made with grated carrots slow-cooked in pure ghee, khoya, and dry fruits.',
        basePrice: 139,
        isVeg: true,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
        variants: [],
        category: 'Desserts',
        categoryId: 'c4444444-4444-4444-8444-444444444444',
        rating: 4.8,
        preparationTime: '5 mins',
      } as ExtendedMenuItem,
    ],
  },
  {
    categoryId: 'c5555555-5555-4555-8555-555555555555',
    name: 'Beverages',
    displayOrder: 5,
    items: [
      {
        menuItemId: 'm1000013-0000-4000-8000-000000000013',
        name: 'Special Mango Lassi',
        description:
          'Thick traditional yogurt drink blended with Alphonso mango pulp and saffron notes.',
        basePrice: 119,
        isVeg: true,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        variants: [],
        category: 'Beverages',
        categoryId: 'c5555555-5555-4555-8555-555555555555',
        rating: 4.9,
        preparationTime: '5 mins',
      } as ExtendedMenuItem,
      {
        menuItemId: 'm1000014-0000-4000-8000-000000000014',
        name: 'Masala Kulhad Chai',
        description:
          'Aromatic Indian tea brewed with cardamom, ginger, cloves and milk, served hot in an earthen pot.',
        basePrice: 49,
        isVeg: true,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        variants: [],
        category: 'Beverages',
        categoryId: 'c5555555-5555-4555-8555-555555555555',
        rating: 4.7,
        preparationTime: '5 mins',
      } as ExtendedMenuItem,
      {
        menuItemId: 'm1000019-0000-4000-8000-000000000019',
        name: 'Fresh Mint Lime Soda',
        description:
          'Refreshing sparkling soda infused with freshly squeezed lime juice, crushed mint leaves and black salt.',
        basePrice: 89,
        isVeg: true,
        isAvailable: true,
        imageUrl:
          'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
        variants: [
          { variantId: 'v119-sweet', name: 'Sweet', priceDelta: 0 },
          { variantId: 'v119-salted', name: 'Salted', priceDelta: 0 },
          { variantId: 'v119-mix', name: 'Sweet & Salted Mix', priceDelta: 0 },
        ],
        category: 'Beverages',
        categoryId: 'c5555555-5555-4555-8555-555555555555',
        rating: 4.8,
        preparationTime: '5 mins',
      } as ExtendedMenuItem,
    ],
  },
];

export const MOCK_FULL_MENU: FullMenu = {
  restaurantId: MOCK_CONFIG.DEFAULT_MOCK_RESTAURANT_ID,
  categories: MOCK_CATEGORIES,
};
