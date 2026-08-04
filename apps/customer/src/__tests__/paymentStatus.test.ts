import {
  isConfirmedStatus,
  isPaymentFailedStatus,
} from '../features/payment/types';

describe('P2-CUS-05 payment status helpers', () => {
  it('treats CONFIRMED as payment truth', () => {
    expect(isConfirmedStatus('CONFIRMED')).toBe(true);
    expect(isConfirmedStatus('PLACED')).toBe(false);
  });

  it('detects cancelled/rejected while awaiting payment', () => {
    expect(isPaymentFailedStatus('CANCELLED')).toBe(true);
    expect(isPaymentFailedStatus('REJECTED')).toBe(true);
    expect(isPaymentFailedStatus('PLACED')).toBe(false);
  });
});
