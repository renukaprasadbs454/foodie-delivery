import {
  isOrderStatus,
  isOrderUuid,
  validateOverrideBody,
  validateOverrideReason,
} from '../features/orders/types';
import {
  isPaymentUuid,
  validateRefundForm,
} from '../features/payments/types';

describe('P2-ADM-04 order / payment helpers', () => {
  it('validates order UUID and status whitelist', () => {
    expect(isOrderUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isOrderUuid('bad')).toBe(false);
    expect(isOrderStatus('DELIVERED')).toBe(true);
    expect(isOrderStatus('UNKNOWN')).toBe(false);
  });

  it('validates override body', () => {
    expect(validateOverrideReason('').ok).toBe(false);
    expect(validateOverrideReason('x'.repeat(501)).ok).toBe(false);
    expect(validateOverrideBody('CANCELLED', 'Fraud review').ok).toBe(true);
    expect(validateOverrideBody('NOPE', 'reason').ok).toBe(false);
  });

  it('validates refund form', () => {
    expect(isPaymentUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(
      validateRefundForm(
        '550e8400-e29b-41d4-a716-446655440000',
        '10.50',
        'Customer complaint',
      ).ok,
    ).toBe(true);
    expect(
      validateRefundForm(
        '550e8400-e29b-41d4-a716-446655440000',
        '0',
        'Customer complaint',
      ).ok,
    ).toBe(false);
    expect(
      validateRefundForm(
        '550e8400-e29b-41d4-a716-446655440000',
        '10',
        '',
      ).ok,
    ).toBe(false);
  });
});
