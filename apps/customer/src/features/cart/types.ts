/**
 * P2-CUS-03 cart helpers — path UUID validation (UI-API Cart).
 * Cart DTO shapes remain in features/menu/types (frozen §5.1).
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCartItemId(value: string): boolean {
  return UUID_RE.test(value);
}

export function canProceedToCheckout(itemCount: number): boolean {
  return itemCount > 0;
}
