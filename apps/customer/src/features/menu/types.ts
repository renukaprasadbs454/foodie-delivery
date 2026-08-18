/**
 * Customer menu + cart add shapes — frozen UI-API Menu + API §4.1 / §5.1 / §5.2
 * (backend FullMenuResponseDto / CartResponseDto / AddCartItemRequestDto).
 * Client never treats displayed prices as cart authority.
 */

export type MenuVariant = {
  variantId: string;
  name: string;
  priceDelta: number | string;
};

export type MenuItem = {
  menuItemId: string;
  name: string;
  description?: string | null;
  basePrice: number | string;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl?: string | null;
  variants: MenuVariant[];
};

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

export type CartItem = {
  cartItemId: string;
  menuItemId: string;
  variantId?: string | null;
  quantity: number;
  notes?: string | null;
  unitPrice: number | string;
  lineTotal: number | string;
};

export type Cart = {
  cartId: string;
  restaurantId?: string | null;
  items: CartItem[];
  subtotal: number | string;
};

/** §5.2 AddCartItemRequest */
export type AddCartItemRequest = {
  menuItemId: string;
  variantId?: string | null;
  quantity: number;
  notes?: string | null;
};

export const MIN_CART_QUANTITY = 1;
export const MAX_CART_QUANTITY = 20;
export const MAX_CART_NOTES_LENGTH = 500;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isMenuRestaurantId(value: string): boolean {
  return UUID_RE.test(value) || value.startsWith('mock-resto-');
}

export function parseMoney(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: number | string | null | undefined): string {
  return parseMoney(value).toFixed(2);
}

export function validateAddCartItem(input: {
  quantity: number;
  notes: string;
  requiresVariant: boolean;
  variantId: string | null;
}): { ok: true } | { ok: false; message: string } {
  if (
    !Number.isInteger(input.quantity) ||
    input.quantity < MIN_CART_QUANTITY ||
    input.quantity > MAX_CART_QUANTITY
  ) {
    return {
      ok: false,
      message: `Quantity must be between ${MIN_CART_QUANTITY} and ${MAX_CART_QUANTITY}.`,
    };
  }
  if (input.notes.length > MAX_CART_NOTES_LENGTH) {
    return {
      ok: false,
      message: `Notes must be at most ${MAX_CART_NOTES_LENGTH} characters.`,
    };
  }
  if (input.requiresVariant && !input.variantId) {
    return { ok: false, message: 'Select a variant.' };
  }
  return { ok: true };
}

/** CART_RESTAURANT_CONFLICT contracted recovery — UI-API suggestedAction CLEAR_CART. */
export function isClearCartConflict(code: string | undefined): boolean {
  return code === 'CART_RESTAURANT_CONFLICT';
}
