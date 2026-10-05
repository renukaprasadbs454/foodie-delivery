import {
  hasConfiguredBankDetails,
  hasMoreLedgerPages,
  isLedgerSort,
  normalizeLedgerList,
  parseMoneyAmount,
  validatePayoutAmount,
} from '@/features/wallet/types';

describe('wallet types (P2-DEL-04)', () => {
  it('whitelists ledger sort values', () => {
    expect(isLedgerSort('createdAt')).toBe(true);
    expect(isLedgerSort('-createdAt')).toBe(true);
    expect(isLedgerSort('amount')).toBe(false);
  });

  it('normalizes ledger arrays and page wrappers', () => {
    const entry = {
      ledgerEntryId: 'l1',
      entryType: 'CREDIT',
      amount: 10,
      referenceType: 'DELIVERY_ASSIGNMENT',
      referenceId: 'r1',
      createdAt: '2026-08-03T00:00:00Z',
    };
    expect(normalizeLedgerList([entry])).toEqual([entry]);
    expect(normalizeLedgerList({ content: [entry] })).toEqual([entry]);
    expect(hasMoreLedgerPages([entry], 20)).toBe(false);
    expect(hasMoreLedgerPages(new Array(20).fill(entry), 20)).toBe(true);
  });

  it('validates payout amount against balance', () => {
    expect(validatePayoutAmount('12.50', 20)).toEqual({
      ok: true,
      amount: 12.5,
    });
    expect(validatePayoutAmount('0', 20).ok).toBe(false);
    expect(validatePayoutAmount('25', 20).ok).toBe(false);
    expect(parseMoneyAmount('10.00')).toBe(10);
    expect(parseMoneyAmount('x')).toBeNull();
  });

  it('validates bank details configuration', () => {
    expect(hasConfiguredBankDetails(undefined)).toBe(false);
    expect(hasConfiguredBankDetails(null)).toBe(false);
    expect(hasConfiguredBankDetails({ accountNumber: '', bankName: '' })).toBe(false);
    expect(hasConfiguredBankDetails({ accountNumber: '1234567890', bankName: '   ' })).toBe(false);
    expect(hasConfiguredBankDetails({ accountNumber: '   ', bankName: 'HDFC Bank' })).toBe(false);
    expect(
      hasConfiguredBankDetails({
        accountNumber: '1234567890',
        bankName: 'HDFC Bank',
        ifscCode: 'HDFC0001234',
        accountHolderName: 'Rahul',
      }),
    ).toBe(true);
  });

  it('maps withdrawal statuses correctly for UI badges', () => {
    const { getWithdrawalStatusInfo } = require('@/features/wallet/types');
    
    // REQUESTED / PENDING -> Pending
    expect(getWithdrawalStatusInfo('REQUESTED').label).toBe('Pending');
    expect(getWithdrawalStatusInfo('PENDING').label).toBe('Pending');
    expect(getWithdrawalStatusInfo('REQUESTED').text).toBe('#B45309');

    // APPROVED / COMPLETED / SUCCESS -> Withdraw Success
    expect(getWithdrawalStatusInfo('APPROVED').label).toBe('Withdraw Success');
    expect(getWithdrawalStatusInfo('COMPLETED').label).toBe('Withdraw Success');
    expect(getWithdrawalStatusInfo('SUCCESS').label).toBe('Withdraw Success');
    expect(getWithdrawalStatusInfo('COMPLETED').text).toBe('#065F46');

    // REJECTED / FAILED -> Rejected
    expect(getWithdrawalStatusInfo('REJECTED').label).toBe('Rejected');
    expect(getWithdrawalStatusInfo('FAILED').label).toBe('Rejected');
    expect(getWithdrawalStatusInfo('REJECTED').text).toBe('#991B1B');

    // PROCESSING -> Processing
    expect(getWithdrawalStatusInfo('PROCESSING').label).toBe('Processing');
    expect(getWithdrawalStatusInfo('PROCESSING').text).toBe('#B45309');
  });
});

