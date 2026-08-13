/**
 * P2-DEL-04 wallet shapes — UI-API Wallet/Ledger/Payout + §9.1–§9.3.
 */

export type WalletBalance = {
  walletAccountId: string;
  balance: number | string;
};

export type LedgerEntryType = 'CREDIT' | 'DEBIT' | string;

export type LedgerReferenceType =
  | 'DELIVERY_ASSIGNMENT'
  | 'REFUND'
  | 'PAYOUT'
  | string;

export type LedgerEntry = {
  ledgerEntryId: string;
  entryType: LedgerEntryType;
  amount: number | string;
  referenceType: LedgerReferenceType;
  referenceId: string;
  createdAt: string;
};

export type LedgerSort = 'createdAt' | '-createdAt' | '+createdAt';

export const LEDGER_SORT_WHITELIST: readonly LedgerSort[] = [
  'createdAt',
  '-createdAt',
  '+createdAt',
] as const;

export const DEFAULT_LEDGER_PAGE_SIZE = 20;

export type LedgerQueryParams = {
  page?: number;
  size?: number;
  sort?: LedgerSort;
  createdAtFrom?: string;
  createdAtTo?: string;
};

export type PayoutRequestResult = {
  payoutId: string;
  status: 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;
  amount: number | string;
};

export type RequestPayoutArg = {
  amount: number;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  idempotencyKey: string;
};

export function isLedgerSort(value: string): value is LedgerSort {
  return (LEDGER_SORT_WHITELIST as readonly string[]).includes(value);
}

export function normalizeLedgerList(data: unknown): LedgerEntry[] {
  if (Array.isArray(data)) return data as LedgerEntry[];
  if (
    data &&
    typeof data === 'object' &&
    Array.isArray((data as { content?: unknown }).content)
  ) {
    return (data as { content: LedgerEntry[] }).content;
  }
  return [];
}

export function hasMoreLedgerPages(
  page: LedgerEntry[] | undefined,
  size: number,
): boolean {
  if (!page) return false;
  return page.length >= size;
}

export function parseMoneyAmount(
  value: number | string | undefined,
): number | null {
  if (value === undefined || value === null) return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function validatePayoutAmount(
  raw: string,
  balance: number | null,
): { ok: true; amount: number } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: 'Enter a payout amount.' };
  }
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: 'Amount must be greater than zero.' };
  }
  if (amount < 0.01) {
    return { ok: false, message: 'Amount must be at least ₹0.01.' };
  }
  if (balance !== null && amount > balance) {
    return {
      ok: false,
      message: 'Amount cannot exceed your displayed wallet balance.',
    };
  }
  return { ok: true, amount: Math.round((amount + Number.EPSILON) * 100) / 100 };
}
