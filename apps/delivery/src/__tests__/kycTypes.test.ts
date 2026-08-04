import { DOC_TYPES, isDeliveryDocType } from '../features/kyc/types';

describe('kyc types (P2-DEL-01)', () => {
  it('accepts LICENSE / VEHICLE_RC / IDENTITY only', () => {
    expect(DOC_TYPES).toEqual(['LICENSE', 'VEHICLE_RC', 'IDENTITY']);
    expect(isDeliveryDocType('LICENSE')).toBe(true);
    expect(isDeliveryDocType('VEHICLE_RC')).toBe(true);
    expect(isDeliveryDocType('IDENTITY')).toBe(true);
    expect(isDeliveryDocType('FSSAI')).toBe(false);
    expect(isDeliveryDocType('')).toBe(false);
  });
});
