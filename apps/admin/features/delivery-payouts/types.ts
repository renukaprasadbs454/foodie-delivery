export type PayoutStatus = 'REQUESTED' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export type PayoutProvider = 'RAZORPAY' | 'CASHFREE';

export type ReconciliationStatus =
  | 'MATCHED'
  | 'AMOUNT_MISMATCH'
  | 'STATUS_MISMATCH'
  | 'MISSING_PROVIDER_RECORD'
  | 'DUPLICATE';

export interface DeliveryPartnerPayout {
  id: string;
  walletAccountId: string;
  partnerId: string;
  partnerName: string;
  partnerPhone: string;
  amount: number;
  status: PayoutStatus;
  provider: PayoutProvider;
  bankRef?: string;
  failureReason?: string;
  requestedAt: string;
  processedAt?: string;
  reconciliationStatus: ReconciliationStatus;
  retryEligible: boolean;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export interface WalletLedgerItem {
  ledgerEntryId: string;
  walletAccountId: string;
  entryType: 'CREDIT' | 'DEBIT';
  amount: number;
  referenceType: string;
  referenceId: string;
  createdAt: string;
}

export interface ProviderInfoReadonly {
  providerName: string;
  gatewayMode: string;
  webhookStatus: string;
  lastPingAt: string;
}

export interface DeliveryPayoutDetailView {
  payout: DeliveryPartnerPayout;
  walletBalance: number;
  totalEarned: number;
  ledgerHistory: WalletLedgerItem[];
  providerInfo: ProviderInfoReadonly;
}

export interface PayoutFilterOptions {
  partnerQuery: string;
  payoutId: string;
  status: PayoutStatus | 'ALL';
  provider: PayoutProvider | 'ALL';
  dateFrom: string;
  dateTo: string;
}

export interface ReconciliationOverview {
  matchedCount: number;
  amountMismatchCount: number;
  statusMismatchCount: number;
  missingProviderRecordCount: number;
  duplicateCount: number;
  discrepancies: DeliveryPartnerPayout[];
}
