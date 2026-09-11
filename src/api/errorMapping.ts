/**
 * error.code → UI treatment — Blueprint §28 / System Design §20 /
 * 04_API_Contracts.md Error Catalog (+ v1.1 inventory).
 */

export type ErrorUiTreatment =
  | 'INLINE_FIELD'
  | 'TOAST'
  | 'FULL_SCREEN'
  | 'MODAL_BLOCKING'
  | 'FORCE_LOGOUT'
  | 'GENERIC';

export type ErrorMappingEntry = {
  treatment: ErrorUiTreatment;
  /** Platform copy key — screens resolve localization; never show raw backend message as primary. */
  messageKey: string;
};

const DEFAULT_ENTRY: ErrorMappingEntry = {
  treatment: 'GENERIC',
  messageKey: 'errors.generic',
};

export const ERROR_CODE_UI_MAP: Record<string, ErrorMappingEntry> = {
  VALIDATION_FAILED: {
    treatment: 'INLINE_FIELD',
    messageKey: 'errors.validationFailed',
  },
  BAD_REQUEST: { treatment: 'TOAST', messageKey: 'errors.badRequest' },
  UNKNOWN_FIELD: { treatment: 'TOAST', messageKey: 'errors.unknownField' },
  IDEMPOTENCY_KEY_REQUIRED: {
    treatment: 'TOAST',
    messageKey: 'errors.idempotencyKeyRequired',
  },
  IDEMPOTENCY_KEY_REUSED: {
    treatment: 'TOAST',
    messageKey: 'errors.idempotencyKeyReused',
  },
  INVALID_SORT_FIELD: {
    treatment: 'TOAST',
    messageKey: 'errors.invalidSortField',
  },
  INVALID_FILE_TYPE: {
    treatment: 'TOAST',
    messageKey: 'errors.invalidFileType',
  },
  FILE_TOO_LARGE: { treatment: 'TOAST', messageKey: 'errors.fileTooLarge' },
  FILE_CONTENT_MISMATCH: {
    treatment: 'TOAST',
    messageKey: 'errors.fileContentMismatch',
  },
  INVALID_WEBHOOK_SIGNATURE: {
    treatment: 'GENERIC',
    messageKey: 'errors.generic',
  },
  USER_TYPE_REQUIRED: {
    treatment: 'INLINE_FIELD',
    messageKey: 'errors.userTypeRequired',
  },
  UNAUTHORIZED: { treatment: 'TOAST', messageKey: 'errors.unauthorized' },
  INVALID_OTP: { treatment: 'INLINE_FIELD', messageKey: 'errors.invalidOtp' },
  OTP_EXPIRED: { treatment: 'INLINE_FIELD', messageKey: 'errors.otpExpired' },
  INVALID_GOOGLE_TOKEN: {
    treatment: 'TOAST',
    messageKey: 'errors.invalidGoogleToken',
  },
  INVALID_REFRESH_TOKEN: {
    treatment: 'FORCE_LOGOUT',
    messageKey: 'errors.sessionExpired',
  },
  TOKEN_REUSE_DETECTED: {
    treatment: 'FORCE_LOGOUT',
    messageKey: 'errors.tokenReuseDetected',
  },
  FORBIDDEN: { treatment: 'FULL_SCREEN', messageKey: 'errors.forbidden' },
  ACCOUNT_DEACTIVATED: {
    treatment: 'MODAL_BLOCKING',
    messageKey: 'errors.accountDeactivated',
  },
  RESOURCE_NOT_FOUND: {
    treatment: 'FULL_SCREEN',
    messageKey: 'errors.resourceNotFound',
  },
  COUPON_CODE_NOT_FOUND: {
    treatment: 'TOAST',
    messageKey: 'errors.couponCodeNotFound',
  },
  CONFLICT: { treatment: 'TOAST', messageKey: 'errors.conflict' },
  CART_RESTAURANT_CONFLICT: {
    treatment: 'MODAL_BLOCKING',
    messageKey: 'errors.cartRestaurantConflict',
  },
  RESTAURANT_PROFILE_ALREADY_EXISTS: {
    treatment: 'TOAST',
    messageKey: 'errors.restaurantProfileExists',
  },
  ADDRESS_IN_USE_BY_ACTIVE_ORDER: {
    treatment: 'TOAST',
    messageKey: 'errors.addressInUse',
  },
  ASSIGNMENT_ALREADY_ACCEPTED: {
    treatment: 'TOAST',
    messageKey: 'errors.assignmentAlreadyAccepted',
  },
  REVIEW_ALREADY_EXISTS: {
    treatment: 'TOAST',
    messageKey: 'errors.reviewAlreadyExists',
  },
  COUPON_CODE_ALREADY_EXISTS: {
    treatment: 'INLINE_FIELD',
    messageKey: 'errors.couponCodeExists',
  },
  ITEM_UNAVAILABLE: {
    treatment: 'TOAST',
    messageKey: 'errors.itemUnavailable',
  },
  CART_EMPTY: { treatment: 'TOAST', messageKey: 'errors.cartEmpty' },
  ADDRESS_NOT_OWNED: {
    treatment: 'TOAST',
    messageKey: 'errors.addressNotOwned',
  },
  CATEGORY_NOT_OWNED: {
    treatment: 'TOAST',
    messageKey: 'errors.categoryNotOwned',
  },
  INVALID_VARIANT_PRICE: {
    treatment: 'TOAST',
    messageKey: 'errors.invalidVariantPrice',
  },
  COUPON_INVALID: { treatment: 'TOAST', messageKey: 'errors.couponInvalid' },
  COUPON_EXPIRED: { treatment: 'TOAST', messageKey: 'errors.couponExpired' },
  COUPON_USAGE_LIMIT_REACHED: {
    treatment: 'TOAST',
    messageKey: 'errors.couponUsageLimit',
  },
  COUPON_MIN_ORDER_NOT_MET: {
    treatment: 'TOAST',
    messageKey: 'errors.couponMinOrder',
  },
  COUPON_NOT_APPLICABLE_TO_RESTAURANT: {
    treatment: 'TOAST',
    messageKey: 'errors.couponNotApplicable',
  },
  ILLEGAL_STATUS_TRANSITION: {
    treatment: 'TOAST',
    messageKey: 'errors.illegalStatusTransition',
  },
  ORDER_NOT_PAYABLE: {
    treatment: 'TOAST',
    messageKey: 'errors.orderNotPayable',
  },
  PAYMENT_NOT_REFUNDABLE: {
    treatment: 'TOAST',
    messageKey: 'errors.paymentNotRefundable',
  },
  KYC_NOT_VERIFIED: {
    treatment: 'MODAL_BLOCKING',
    messageKey: 'errors.kycNotVerified',
  },
  INSUFFICIENT_BALANCE: {
    treatment: 'TOAST',
    messageKey: 'errors.insufficientBalance',
  },
  ORDER_NOT_DELIVERED: {
    treatment: 'TOAST',
    messageKey: 'errors.orderNotDelivered',
  },
  INVALID_PERCENT_VALUE: {
    treatment: 'INLINE_FIELD',
    messageKey: 'errors.invalidPercentValue',
  },
  MAX_DISCOUNT_REQUIRED_FOR_PERCENT: {
    treatment: 'INLINE_FIELD',
    messageKey: 'errors.maxDiscountRequired',
  },
  RATE_LIMITED: { treatment: 'TOAST', messageKey: 'errors.rateLimited' },
  PAYLOAD_TOO_LARGE: {
    treatment: 'TOAST',
    messageKey: 'errors.payloadTooLarge',
  },
  EXTERNAL_SERVICE_ERROR: {
    treatment: 'TOAST',
    messageKey: 'errors.externalService',
  },
  INTERNAL_ERROR: { treatment: 'GENERIC', messageKey: 'errors.generic' },
};

export function mapErrorCode(code: string | undefined | null): ErrorMappingEntry {
  if (!code) return DEFAULT_ENTRY;
  return ERROR_CODE_UI_MAP[code] ?? DEFAULT_ENTRY;
}

export function isForceLogoutError(code: string | undefined | null): boolean {
  return mapErrorCode(code).treatment === 'FORCE_LOGOUT';
}
