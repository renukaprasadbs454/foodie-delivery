'use client';

import React, { useEffect, useState } from 'react';
import { Text, trackAnalyticsEvent, useTheme } from 'foodie-shared-web';
import { GAP_API_17_PAYMENT_LIST } from '@/constants/gaps';

import { useAppSelector } from '@/store/hooks';
import { selectActiveModule } from '@/store/moduleSlice';

export interface WithdrawRequest {
  id: string;
  vendorName: string;
  module: string;
  amount: number;
  bankAccount: string;
  requestedDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const MOCK_WITHDRAWS: WithdrawRequest[] = [
  {
    id: 'w101',
    vendorName: 'Royal Biryani House',
    module: 'North Indian & Biryani',
    amount: 24500,
    bankAccount: 'HDFC Bank •• 4321',
    requestedDate: '2025-08-08',
    status: 'PENDING',
  },
  {
    id: 'w102',
    vendorName: 'Bella Italia Pizzeria',
    module: 'Italian & Pizza',
    amount: 18900,
    bankAccount: 'ICICI Bank •• 8765',
    requestedDate: '2025-08-07',
    status: 'APPROVED',
  },
  {
    id: 'w103',
    vendorName: 'Sweet Dreams Bakery & Cafe',
    module: 'Bakery & Desserts',
    amount: 9800,
    bankAccount: 'SBI Bank •• 1092',
    requestedDate: '2025-08-06',
    status: 'PENDING',
  },
];

export function PaymentsPage() {
  const { tokens } = useTheme();
  const activeModule = useAppSelector(selectActiveModule);
  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>(MOCK_WITHDRAWS);
  const [refundPaymentUuid, setRefundPaymentUuid] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    trackAnalyticsEvent('admin_payments_viewed', {
      gapId: GAP_API_17_PAYMENT_LIST,
    });
  }, []);

  const handleApproveWithdraw = (id: string) => {
    setWithdraws((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'APPROVED' } : w)),
    );
    setToastMsg('Vendor withdraw request approved!');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleProcessRefund = () => {
    if (!refundPaymentUuid.trim()) {
      alert('Please enter a valid Payment UUID');
      return;
    }
    setToastMsg(`Refund of ₹${refundAmount || '0'} processed for Payment UUID: ${refundPaymentUuid.slice(0, 8)}...`);
    setRefundPaymentUuid('');
    setRefundAmount('');
    setRefundReason('');
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <Text as="h1" variant="heading1" color="#14532D">
          Finance, Disbursements & Refunds
        </Text>
        <Text as="p" variant="caption" color="#64748B">
          Vendor payout requests, commission settlement logs & payment refunds
        </Text>
      </div>

      {/* Financial Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #14532D',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <Text as="span" variant="caption" color="#64748B">
            Total Admin Net Commission
          </Text>
          <Text as="h2" variant="heading1" color="#14532D" style={{ marginTop: 4 }}>
            ₹3,42,800
          </Text>
        </div>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #F59E0B',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <Text as="span" variant="caption" color="#64748B">
            Pending Vendor Payouts
          </Text>
          <Text as="h2" variant="heading1" color="#D97706" style={{ marginTop: 4 }}>
            ₹34,300
          </Text>
        </div>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #059669',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <Text as="span" variant="caption" color="#64748B">
            Total Vendor Disbursements
          </Text>
          <Text as="h2" variant="heading1" color="#059669" style={{ marginTop: 4 }}>
            ₹18,90,400
          </Text>
        </div>
      </div>

      {/* Grid: Vendor Withdrawals & Refund Processing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
        {/* Vendor Withdraw Requests Table */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <Text as="h2" variant="heading3" color="#14532D">
              Vendor Withdrawal Requests
            </Text>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 12 }}>
                <th style={{ padding: '12px 20px' }}>Vendor / Store</th>
                <th style={{ padding: '12px 20px' }}>Payout Amount</th>
                <th style={{ padding: '12px 20px' }}>Bank Account</th>
                <th style={{ padding: '12px 20px' }}>Status</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {withdraws
                .filter((w) => {
                  if (activeModule === 'FOOD') return true;
                  if (activeModule === 'RESTAURANTS') return w.module.includes('Indian') || w.module.includes('Italian') || w.module.includes('Pizza');
                  if (activeModule === 'CAFES') return w.module.includes('Bakery') || w.module.includes('Desserts') || w.module.includes('Cafe');
                  if (activeModule === 'CLOUD_KITCHEN') return w.module.includes('Burgers') || w.module.includes('Fast Food') || w.module.includes('Asian');
                  return true;
                })
                .map((w) => (
                <tr key={w.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#14532D' }}>{w.vendorName}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{w.module} • {w.requestedDate}</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 800, color: '#14532D' }}>
                    ₹{w.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#475569', fontSize: 13 }}>{w.bankAccount}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        backgroundColor: w.status === 'APPROVED' ? '#D1FAE5' : '#FEF3C7',
                        color: w.status === 'APPROVED' ? '#047857' : '#B45309',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: 20,
                      }}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    {w.status === 'PENDING' ? (
                      <button
                        type="button"
                        onClick={() => handleApproveWithdraw(w.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#14532D',
                          color: '#F59E0B',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Approve Payout
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Refund Processing Box */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #F59E0B',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            height: 'fit-content',
          }}
        >
          <div>
            <Text as="h2" variant="heading3" color="#14532D">
              Issue Payment Refund
            </Text>
            <Text as="p" variant="caption" color="#64748B">
              Process direct refunds to customer account by Payment UUID (GAP-API-17)
            </Text>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Payment UUID</label>
            <input
              type="text"
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              value={refundPaymentUuid}
              onChange={(e) => setRefundPaymentUuid(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Refund Amount (₹)</label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Audit Reason</label>
            <input
              type="text"
              placeholder="e.g. Customer cancelled order before preparation"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleProcessRefund}
            style={{
              padding: '12px 18px',
              backgroundColor: '#F59E0B',
              color: '#14532D',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginTop: 8,
            }}
          >
            Execute Refund
          </button>
        </div>
      </div>

      {toastMsg ? (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: '#14532D',
            color: '#F59E0B',
            padding: '12px 24px',
            borderRadius: 8,
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          💳 {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
