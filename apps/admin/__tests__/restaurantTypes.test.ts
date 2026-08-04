import {
  formatCommissionPct,
  isUuid,
  validateSuspendReason,
} from '../features/restaurants/types';
import { isPartnerUuid } from '../features/deliveryPartners/types';

describe('P2-ADM-03 restaurant / partner helpers', () => {
  it('validates UUIDs', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isUuid('not-a-uuid')).toBe(false);
    expect(isPartnerUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('validates suspend reason required ≤500', () => {
    expect(validateSuspendReason('').ok).toBe(false);
    expect(validateSuspendReason('   ').ok).toBe(false);
    expect(validateSuspendReason('Policy violation').ok).toBe(true);
    expect(validateSuspendReason('x'.repeat(501)).ok).toBe(false);
  });

  it('formats commission percent', () => {
    expect(formatCommissionPct(12.5)).toBe('12.5%');
    expect(formatCommissionPct(null)).toBe('—');
  });
});
