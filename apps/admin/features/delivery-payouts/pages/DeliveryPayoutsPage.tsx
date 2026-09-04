'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'foodie-shared-web';
import { PayoutFilterBar } from '../components/PayoutFilterBar';
import { PayoutListTable } from '../components/PayoutListTable';
import { PayoutDetailModal } from '../components/PayoutDetailModal';
import { ReconciliationStudio } from '../components/ReconciliationStudio';
import type {
  DeliveryPartnerPayout,
  PayoutFilterOptions,
  ReconciliationOverview,
  WalletLedgerItem,
} from '../types';

const INITIAL_MOCK_PAYOUTS: DeliveryPartnerPayout[] = [
  {
    id: 'PO-9001',
    walletAccountId: 'w-acc-1111-2222',
    partnerId: 'p1111111-2222-3333-4444-555555555555',
    partnerName: 'Vikram Choudhary',
    partnerPhone: '+91 98111 22233',
    amount: 3450.0,
    status: 'SUCCESS',
    provider: 'RAZORPAY',
    bankRef: 'RZP-PY-882391029',
    requestedAt: '2026-08-25 10:15',
    processedAt: '2026-08-25 10:18',
    reconciliationStatus: 'MATCHED',
    retryEligible: false,
    accountHolderName: 'Vikram Choudhary',
    accountNumber: '981273918239',
    ifscCode: 'HDFC0001234',
    bankName: 'HDFC Bank',
  },
  {
    id: 'PO-9002',
    walletAccountId: 'w-acc-2222-3333',
    partnerId: 'p2222222-3333-4444-5555-666666666666',
    partnerName: 'Arjun Das',
    partnerPhone: '+91 98222 33344',
    amount: 1820.5,
    status: 'REQUESTED',
    provider: 'RAZORPAY',
    requestedAt: '2026-08-26 08:30',
    reconciliationStatus: 'MATCHED',
    retryEligible: false,
    accountHolderName: 'Arjun Das',
    accountNumber: '887711223344',
    ifscCode: 'ICIC0005678',
    bankName: 'ICICI Bank',
  },
  {
    id: 'PO-9003',
    walletAccountId: 'w-acc-3333-4444',
    partnerId: 'p3333333-4444-5555-6666-777777777777',
    partnerName: 'Siddharth Rao',
    partnerPhone: '+91 98333 44455',
    amount: 2200.0,
    status: 'FAILED',
    provider: 'CASHFREE',
    bankRef: 'CF-ERR-9910',
    failureReason: 'Invalid IFSC code or beneficiary account mismatch',
    requestedAt: '2026-08-24 14:20',
    processedAt: '2026-08-24 14:22',
    reconciliationStatus: 'STATUS_MISMATCH',
    retryEligible: true,
    accountHolderName: 'Siddharth Rao',
    accountNumber: '776655443322',
    ifscCode: 'SBIN0001092',
    bankName: 'State Bank of India',
  },
  {
    id: 'PO-9004',
    walletAccountId: 'w-acc-4444-5555',
    partnerId: 'p4444444-5555-6666-7777-888888888888',
    partnerName: 'Rahul Sharma',
    partnerPhone: '+91 98444 55566',
    amount: 4100.0,
    status: 'PROCESSING',
    provider: 'RAZORPAY',
    bankRef: 'RZP-PY-77123490',
    requestedAt: '2026-08-26 09:10',
    reconciliationStatus: 'MATCHED',
    retryEligible: false,
    accountHolderName: 'Rahul Sharma',
    accountNumber: '112233445566',
    ifscCode: 'AXIS0009988',
    bankName: 'Axis Bank',
  },
  {
    id: 'PO-9005',
    walletAccountId: 'w-acc-5555-6666',
    partnerId: 'p5555555-6666-7777-8888-999999999999',
    partnerName: 'Anita Patel',
    partnerPhone: '+91 98555 66677',
    amount: 1250.0,
    status: 'FAILED',
    provider: 'RAZORPAY',
    failureReason: 'Beneficiary bank network connection timeout',
    requestedAt: '2026-08-23 16:45',
    processedAt: '2026-08-23 16:46',
    reconciliationStatus: 'AMOUNT_MISMATCH',
    retryEligible: true,
    accountHolderName: 'Anita Patel',
    accountNumber: '554433221100',
    ifscCode: 'KKBK0004321',
    bankName: 'Kotak Mahindra Bank',
  },
];

const MOCK_LEDGER_ITEMS: WalletLedgerItem[] = [
  {
    ledgerEntryId: 'LEDGER-101',
    walletAccountId: 'w-acc-1111-2222',
    entryType: 'CREDIT',
    amount: 140.0,
    referenceType: 'DELIVERY_EARNING',
    referenceId: 'ORD-8801',
    createdAt: '2026-08-25 12:15',
  },
  {
    ledgerEntryId: 'LEDGER-102',
    walletAccountId: 'w-acc-1111-2222',
    entryType: 'CREDIT',
    amount: 90.0,
    referenceType: 'DELIVERY_EARNING',
    referenceId: 'ORD-8802',
    createdAt: '2026-08-25 11:40',
  },
  {
    ledgerEntryId: 'LEDGER-103',
    walletAccountId: 'w-acc-1111-2222',
    entryType: 'DEBIT',
    amount: 3450.0,
    referenceType: 'PAYOUT_SETTLEMENT',
    referenceId: 'PO-9001',
    createdAt: '2026-08-25 10:18',
  },
];

const DEFAULT_FILTERS: PayoutFilterOptions = {
  partnerQuery: '',
  payoutId: '',
  status: 'ALL',
  provider: 'ALL',
  dateFrom: '',
  dateTo: '',
};

export function DeliveryPayoutsPage() {
  const { tokens } = useTheme();

  const [payouts, setPayouts] = useState<DeliveryPartnerPayout[]>(INITIAL_MOCK_PAYOUTS);
  const [filters, setFilters] = useState<PayoutFilterOptions>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<'PAYOUTS' | 'RECONCILIATION' | 'PROVIDERS'>('PAYOUTS');
  const [selectedPayout, setSelectedPayout] = useState<DeliveryPartnerPayout | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'DETAILS' | 'WALLET'>('DETAILS');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Filter Logic
  const filteredPayouts = payouts.filter((p) => {
    if (filters.status !== 'ALL' && p.status !== filters.status) return false;
    if (filters.provider !== 'ALL' && p.provider !== filters.provider) return false;
    if (filters.payoutId && !p.id.toLowerCase().includes(filters.payoutId.toLowerCase())) return false;
    if (filters.partnerQuery) {
      const q = filters.partnerQuery.toLowerCase();
      const matchName = p.partnerName.toLowerCase().includes(q);
      const matchPhone = p.partnerPhone.toLowerCase().includes(q);
      const matchId = p.partnerId.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchId) return false;
    }
    return true;
  });

  // Calculate Metrics
  const totalVolume = payouts.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingCount = payouts.filter((p) => p.status === 'REQUESTED' || p.status === 'PROCESSING').length;
  const successCount = payouts.filter((p) => p.status === 'SUCCESS').length;
  const successRate = payouts.length > 0 ? Math.round((successCount / payouts.length) * 100) : 0;
  const discrepancyCount = payouts.filter((p) => p.reconciliationStatus !== 'MATCHED').length;

  const reconciliationOverview: ReconciliationOverview = {
    matchedCount: payouts.filter((p) => p.reconciliationStatus === 'MATCHED').length,
    amountMismatchCount: payouts.filter((p) => p.reconciliationStatus === 'AMOUNT_MISMATCH').length,
    statusMismatchCount: payouts.filter((p) => p.reconciliationStatus === 'STATUS_MISMATCH').length,
    missingProviderRecordCount: payouts.filter((p) => p.reconciliationStatus === 'MISSING_PROVIDER_RECORD').length,
    duplicateCount: payouts.filter((p) => p.reconciliationStatus === 'DUPLICATE').length,
    discrepancies: payouts.filter((p) => p.reconciliationStatus !== 'MATCHED'),
  };

  const handleRetryPayout = (targetPayout: DeliveryPartnerPayout) => {
    if (!targetPayout.retryEligible) {
      showToast('This payout is not eligible for retry.');
      return;
    }

    setPayouts((prev) =>
      prev.map((p) =>
        p.id === targetPayout.id
          ? {
              ...p,
              status: 'PROCESSING',
              failureReason: undefined,
              processedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              retryEligible: false,
            }
          : p,
      ),
    );

    if (selectedPayout && selectedPayout.id === targetPayout.id) {
      setSelectedPayout((prev) =>
        prev
          ? {
              ...prev,
              status: 'PROCESSING',
              failureReason: undefined,
              processedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
              retryEligible: false,
            }
          : null,
      );
    }

    showToast(`Retry initiated for Payout ${targetPayout.id}. Status set to PROCESSING.`);
  };

  const handleOpenDetailModal = (p: DeliveryPartnerPayout, tab: 'DETAILS' | 'WALLET' = 'DETAILS') => {
    setSelectedPayout(p);
    setModalInitialTab(tab);
  };

  return (
    <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.5px' }}>
            Delivery Partner Payout Studio
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, margin: 0 }}>
            Manage deliveryman payout requests, gateway settlements, automated reconciliation, and wallet ledger audits.
          </p>
        </div>

        {toastMsg && (
          <div
            style={{
              backgroundColor: '#0F3D21',
              color: '#FFFFFF',
              padding: '10px 20px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(15, 61, 33, 0.25)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
             {toastMsg}
          </div>
        )}
      </div>

      {/* Overview Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Total Volume */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 20,
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Total Payout Volume
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0F3D21', marginTop: 4 }}>
            ₹{totalVolume.toFixed(2)}
          </div>
          <div style={{ fontSize: 12, color: '#166534', marginTop: 4, fontWeight: 700 }}>
            Across {payouts.length} payout requests
          </div>
        </div>

        {/* Pending Requests */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 20,
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Open / Pending Requests
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#D97706', marginTop: 4 }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: 12, color: '#B45309', marginTop: 4, fontWeight: 700 }}>
            REQUESTED or PROCESSING
          </div>
        </div>

        {/* Settlement Success Rate */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 20,
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Success Rate
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#047857', marginTop: 4 }}>
            {successRate}%
          </div>
          <div style={{ fontSize: 12, color: '#047857', marginTop: 4, fontWeight: 700 }}>
            {successCount} successfully settled
          </div>
        </div>

        {/* Reconciliation Discrepancies */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 20,
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
            Audit Discrepancies
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: discrepancyCount > 0 ? '#DC2626' : '#059669', marginTop: 4 }}>
            {discrepancyCount}
          </div>
          <div style={{ fontSize: 12, color: discrepancyCount > 0 ? '#B91C1C' : '#059669', marginTop: 4, fontWeight: 700 }}>
            {discrepancyCount > 0 ? 'Requires reconciliation attention' : 'All transactions matched'}
          </div>
        </div>
      </div>

      {/* Primary Studio Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #E2E8F0', gap: 24 }}>
        <button
          type="button"
          onClick={() => setActiveTab('PAYOUTS')}
          style={{
            padding: '12px 6px',
            fontSize: 15,
            fontWeight: 800,
            color: activeTab === 'PAYOUTS' ? '#0F3D21' : '#64748B',
            borderBottom: activeTab === 'PAYOUTS' ? '4px solid #0F3D21' : '4px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
           Payout Requests & History ({payouts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RECONCILIATION')}
          style={{
            padding: '12px 6px',
            fontSize: 15,
            fontWeight: 800,
            color: activeTab === 'RECONCILIATION' ? '#0F3D21' : '#64748B',
            borderBottom: activeTab === 'RECONCILIATION' ? '4px solid #0F3D21' : '4px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
           Reconciliation Studio ({discrepancyCount > 0 ? ` ${discrepancyCount}` : 'OK'})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PROVIDERS')}
          style={{
            padding: '12px 6px',
            fontSize: 15,
            fontWeight: 800,
            color: activeTab === 'PROVIDERS' ? '#0F3D21' : '#64748B',
            borderBottom: activeTab === 'PROVIDERS' ? '4px solid #0F3D21' : '4px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
          }}
        >
           Provider Config (Read-Only)
        </button>
      </div>

      {/* Tab 1: Payout Requests & History */}
      {activeTab === 'PAYOUTS' && (
        <>
          <PayoutFilterBar
            filters={filters}
            onChange={setFilters}
            onReset={() => setFilters(DEFAULT_FILTERS)}
          />
          <PayoutListTable
            payouts={filteredPayouts}
            onSelectPayout={(p) => handleOpenDetailModal(p, 'DETAILS')}
            onRetryPayout={handleRetryPayout}
            onViewWalletLedger={(p) => handleOpenDetailModal(p, 'WALLET')}
          />
        </>
      )}

      {/* Tab 2: Reconciliation Studio */}
      {activeTab === 'RECONCILIATION' && (
        <ReconciliationStudio
          overview={reconciliationOverview}
          onSelectPayout={(p) => handleOpenDetailModal(p, 'DETAILS')}
        />
      )}

      {/* Tab 3: Provider Config (Read-Only) */}
      {activeTab === 'PROVIDERS' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Razorpay Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: 24,
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#1D4ED8' }}>
                Razorpay Payout Gateway
              </div>
              <span style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 800 }}>
                ONLINE / OPERATIONAL
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 700 }}>ACCOUNT ID</span>
                <strong style={{ color: '#0F172A' }}>rzp_account_live_490182390</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 700 }}>PAYOUT DISPATCH MODE</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>Automated Direct Bank Transfer (IMPS/NEFT)</span>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 700 }}>WEBHOOK LISTENER</span>
                <code style={{ fontSize: 12, backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>
                  /api/v1/payments/razorpay-webhook
                </code>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginTop: 8 }}>
                 Provider credentials and secret keys are stored in encrypted environment variables and never returned over API endpoints.
              </div>
            </div>
          </div>

          {/* Cashfree Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              padding: 24,
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#C2410C' }}>
                Cashfree Payout Gateway
              </div>
              <span style={{ backgroundColor: '#FEF3C7', color: '#B45309', padding: '3px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 800 }}>
                STANDBY / SECONDARY
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 700 }}>APP ID</span>
                <strong style={{ color: '#0F172A' }}>cf_app_live_8839021940</strong>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 700 }}>PAYOUT DISPATCH MODE</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>Fallback Instant UPI Transfer</span>
              </div>
              <div>
                <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 700 }}>WEBHOOK LISTENER</span>
                <code style={{ fontSize: 12, backgroundColor: '#F1F5F9', padding: '2px 6px', borderRadius: 4 }}>
                  /api/v1/payments/cashfree-webhook
                </code>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, marginTop: 8 }}>
                 Provider credentials and secret keys are stored in encrypted environment variables and never returned over API endpoints.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payout Detail Modal */}
      {selectedPayout && (
        <PayoutDetailModal
          payout={selectedPayout}
          walletBalance={12450.0}
          totalEarned={38900.0}
          ledgerHistory={MOCK_LEDGER_ITEMS}
          onClose={() => setSelectedPayout(null)}
          onRetry={handleRetryPayout}
          initialTab={modalInitialTab}
        />
      )}
    </div>
  );
}
