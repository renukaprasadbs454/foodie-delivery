/**
 * P2-RES-03 menu management shapes — UI-API Categories/MenuItems/Variants +
 * FullMenuResponseDto / create DTOs §4.2–§4.5.
 */

export type MenuVariant = {
  variantId: string;
  name: string;
  priceDelta: number | string;
};

export type FoodType = 'VEG' | 'NON_VEG';

export type MenuItem = {
  menuItemId: string;
  name: string;
  description?: string | null;
  basePrice: number | string;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl?: string | null;
  variants: MenuVariant[];
  foodType?: FoodType;
  category?: string;
  categoryId?: string;
  categoryName?: string;
  rating?: number;
  preparationTime?: string;
  createdAt?: number;
};

export type NormalizedMenuItem = {
  menuItemId: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  basePrice: number;
  imageUrl?: string | null;
  foodType: FoodType;
  isVeg: boolean;
  isAvailable: boolean;
  rating: number;
  preparationTime: string;
  variants: MenuVariant[];
  createdAt: number;
};

export function determineFoodType(
  rawFoodType?: string | null,
  isVeg?: boolean | null,
  _name?: string | null,
  _description?: string | null,
): FoodType {
  if (rawFoodType === 'VEG' || rawFoodType === 'NON_VEG') {
    return rawFoodType;
  }
  if (isVeg === true) {
    return 'VEG';
  }
  return 'NON_VEG';
}

export function normalizeMenuItem(
  raw: Partial<MenuItem> & Record<string, any>,
  categoryNameFallback = 'Main Course',
  categoryIdFallback = 'c3333333-3333-4333-8333-333333333333',
): NormalizedMenuItem {
  const foodType = determineFoodType(raw.foodType, raw.isVeg, raw.name, raw.description);
  const isVeg = foodType === 'VEG';
  return {
    menuItemId: raw.menuItemId || raw.id || `m-${Math.random().toString(36).substring(2, 9)}`,
    name: raw.name || 'Unnamed Item',
    description: raw.description ?? '',
    categoryId: raw.categoryId || categoryIdFallback,
    categoryName: raw.categoryName || raw.category || categoryNameFallback,
    basePrice: parseMoney(raw.basePrice ?? raw.price),
    imageUrl: raw.imageUrl ?? null,
    foodType,
    isVeg,
    isAvailable: typeof raw.isAvailable === 'boolean' ? raw.isAvailable : true,
    rating: typeof raw.rating === 'number' && Number.isFinite(raw.rating) ? raw.rating : 4.5,
    preparationTime: raw.preparationTime || '15 min',
    variants: Array.isArray(raw.variants) ? raw.variants : [],
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
  };
}

export type MenuCategory = {
  categoryId: string;
  name: string;
  displayOrder: number;
  items: MenuItem[];
};

export type FullMenu = {
  restaurantId: string;
  categories: MenuCategory[];
};

export type CreateCategoryRequest = {
  name: string;
  displayOrder?: number;
};

export type CreateMenuItemRequest = {
  categoryId: string;
  name: string;
  description?: string | null;
  basePrice: number;
  isVeg: boolean;
};

export type UpdateMenuItemRequest = {
  menuItemId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  basePrice: number;
  isVeg: boolean;
};

export type AddVariantRequest = {
  name: string;
  priceDelta: number;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function parseMoney(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: number | string | null | undefined): string {
  return `₹${parseMoney(value).toFixed(2)}`;
}

export function sortCategories(categories: MenuCategory[]): MenuCategory[] {
  return [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function findMenuItem(
  menu: FullMenu | undefined,
  menuItemId: string,
): { category: MenuCategory; item: MenuItem } | null {
  if (!menu) return null;
  for (const category of menu.categories) {
    const item = category.items.find((i) => i.menuItemId === menuItemId);
    if (item) return { category, item };
  }
  return null;
}

export function validateCategoryName(
  name: string,
): { ok: true; name: string } | { ok: false; message: string } {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    return { ok: false, message: 'Category name must be 1–100 characters.' };
  }
  return { ok: true, name: trimmed };
}

export function validateMenuItemForm(input: {
  categoryId: string;
  name: string;
  description: string;
  basePrice: string;
  isVeg: boolean;
}):
  | { ok: true; value: CreateMenuItemRequest }
  | { ok: false; message: string } {
  if (!isUuid(input.categoryId)) {
    return { ok: false, message: 'Select a valid category.' };
  }
  const name = input.name.trim();
  if (name.length < 2 || name.length > 255) {
    return { ok: false, message: 'Item name must be 2–255 characters.' };
  }
  const description = input.description.trim();
  if (description.length > 2000) {
    return { ok: false, message: 'Description must be at most 2000 characters.' };
  }
  const basePrice = Number(input.basePrice);
  if (!Number.isFinite(basePrice) || basePrice < 0.01) {
    return { ok: false, message: 'Base price must be at least 0.01.' };
  }
  const rounded = Math.round(basePrice * 100) / 100;
  if (Math.abs(rounded - basePrice) > 1e-9) {
    return { ok: false, message: 'Base price must have at most 2 decimal places.' };
  }
  return {
    ok: true,
    value: {
      categoryId: input.categoryId,
      name,
      description: description || null,
      basePrice: rounded,
      isVeg: input.isVeg,
    },
  };
}

export function validateVariantForm(input: {
  name: string;
  priceDelta: string;
  basePrice: number | string;
}):
  | { ok: true; value: AddVariantRequest }
  | { ok: false; message: string } {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 100) {
    return { ok: false, message: 'Variant name must be 1–100 characters.' };
  }
  const priceDelta = Number(input.priceDelta);
  if (!Number.isFinite(priceDelta)) {
    return { ok: false, message: 'Enter a valid price delta.' };
  }
  const rounded = Math.round(priceDelta * 100) / 100;
  if (Math.abs(rounded - priceDelta) > 1e-9) {
    return {
      ok: false,
      message: 'Price delta must have at most 2 decimal places.',
    };
  }
  if (parseMoney(input.basePrice) + rounded <= 0) {
    return {
      ok: false,
      message: 'Base price + price delta must be greater than zero.',
    };
  }
  return { ok: true, value: { name, priceDelta: rounded } };
}
