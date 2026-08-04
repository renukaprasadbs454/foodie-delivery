/** Documented API Gaps — never invent these endpoints. */
export const GAP_API_14_RESTAURANT_LIST = 'GAP-API-14' as const;
export const GAP_API_15_PARTNER_LIST = 'GAP-API-15' as const;
export const GAP_API_16_ORDER_LIST = 'GAP-API-16' as const;
export const GAP_API_17_PAYMENT_LIST = 'GAP-API-17' as const;
export const GAP_API_19_COUPON_LIST = 'GAP-API-19' as const;
export const GAP_API_20_GLOBAL_REVIEWS = 'GAP-API-20' as const;

export const RESTAURANT_LIST_GAP_MESSAGE =
  'Admin restaurant list/search GET is not available (GAP-API-14). Open a restaurant by UUID deep-link. Do not invent a list endpoint or reuse public APPROVED-only listing.';

export const PARTNER_LIST_GAP_MESSAGE =
  'Admin delivery-partner list GET is not available (GAP-API-15). Enter a partner UUID to KYC-approve. Do not invent a list endpoint.';

export const ORDER_LIST_GAP_MESSAGE =
  'Admin order list/search GET is not available (GAP-API-16). Open an order by UUID deep-link. Do not invent a list endpoint.';

export const PAYMENT_LIST_GAP_MESSAGE =
  'Admin payments/settlements list GET is not available (GAP-API-17). Refund by payment UUID only. Never call payment webhooks from the Admin UI.';

export const COUPON_LIST_GAP_MESSAGE =
  'Admin coupon list GET is not available (GAP-API-19). Create coupons and deactivate by UUID. Do not invent a list endpoint.';

export const GLOBAL_REVIEWS_GAP_MESSAGE =
  'Admin-global reviews list and moderation hide/delete are not available (GAP-API-20). Load public reviews by restaurant UUID only. Do not invent global list or moderation APIs.';
