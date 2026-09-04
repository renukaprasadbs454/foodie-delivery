'use client';

import React from 'react';
import type { DeliveryPartnerPayout, PayoutStatus } from '../types';

interface PayoutListTableProps {
  payouts: DeliveryPartnerPayout[];
  onSelectPayout: (payout: DeliveryPartnerPayout) => void;
  onRetryPayout: (payout: DeliveryPartnerPayout) => void;
  onViewWalletLedger: (payout: DeliveryPartnerPayout) => void;
}

export function PayoutListTable({
  payouts,
  onSelectPayout,
  onRetryPayout,
  onViewWalletLedger,
}: PayoutListTableProps) {
  const getStatusBadge = (status: PayoutStatus) => {
    switch (status) {
      case 'SUCCESS':
        return { bg: '#DEF7EC', color: '#03543F', border: '#BCF0DA', label: 'SUCCESS' };
      case 'PROCESSING':
        return { bg: '#E1EFFE', color: '#1E429F', border: '#C3DDFD', label: 'PROCESSING' };
      case 'REQUESTED':
        return { bg: '#FEF08A', color: '#713F12', border: '#FDE047', label: 'REQUESTED' };
      case 'FAILED':
        return { bg: '#FDE8E8', color: '#9B1C1C', border: '#FBD5D5', label: 'FAILED' };
      default:
        return { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0', label: status };
    }
  };

  const getReconciliationBadge = (reconcil: string) => {
    if (reconcil === 'MATCHED') {
      return { bg: '#ECFDF5', color: '#047857', label: 'MATCHED' };
    }
    return { bg: '#FEF2F2', color: '#B91C1C', label: reconcil.replace(/_/g, ' ') };
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Payout ID</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Delivery Partner</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Amount</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Provider</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Reconciliation</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Requested Date</th>
              <th style={{ padding: '12px 16px', fontWeight: 700 }}>Processed Date</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payouts.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B' }}>
                  No delivery partner payouts found matching current search and filter criteria.
                </td>
              </tr>
            ) : (
              payouts.map((p) => {
                const sBadge = getStatusBadge(p.status);
                const rBadge = getReconciliationBadge(p.reconciliationStatus);
                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                  >
                    {/* Payout ID */}
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
                      {p.id}
                      {p.bankRef ? (
                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 400 }}>Ref: {p.bankRef}</div>
                      ) : null}
                    </td>

                    {/* Delivery Partner */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{p.partnerName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{p.partnerPhone}</div>
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F3D21', fontSize: 14 }}>
                      ₹{p.amount.toFixed(2)}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: sBadge.bg,
                          color: sBadge.color,
                          border: `1px solid ${sBadge.border}`,
                          padding: '3px 9px',
                          borderRadius: 9999,
                          fontSize: 11,
                          fontWeight: 700,
                          display: 'inline-block',
                        }}
                      >
                        {sBadge.label}
                      </span>
                      {p.status === 'FAILED' && p.failureReason && (
                        <div style={{ fontSize: 11, color: '#9B1C1C', marginTop: 3, maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.failureReason}>
                          {p.failureReason}
                        </div>
                      )}
                    </td>

                    {/* Provider */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: p.provider === 'RAZORPAY' ? '#EFF6FF' : '#FFF7ED',
                          color: p.provider === 'RAZORPAY' ? '#1D4ED8' : '#C2410C',
                          border: p.provider === 'RAZORPAY' ? '1px solid #BFDBFE' : '1px solid #FFEDD5',
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {p.provider}
                      </span>
                    </td>

                    {/* Reconciliation */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          backgroundColor: rBadge.bg,
                          color: rBadge.color,
                          padding: '2px 8px',
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {rBadge.label}
                      </span>
                    </td>

                    {/* Requested Date */}
                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {p.requestedAt}
                    </td>

                    {/* Processed Date */}
                    <td style={{ padding: '12px 16px', color: '#475569', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {p.processedAt || '—'}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => onSelectPayout(p)}
                          style={{
                            padding: '5px 10px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#0F3D21',
                            backgroundColor: '#E8F5E9',
                            border: '1px solid #A5D6A7',
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                        >
                          View
                        </button>

                        {p.retryEligible && (
                          <button
                            type="button"
                            onClick={() => onRetryPayout(p)}
                            style={{
                              padding: '5px 10px',
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#B45309',
                              backgroundColor: '#FEF3C7',
                              border: '1px solid #FDE68A',
                              borderRadius: 6,
                              cursor: 'pointer',
                            }}
                          >
                            Retry
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onViewWalletLedger(p)}
                          style={{
                            padding: '5px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#475569',
                            backgroundColor: '#F1F5F9',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                          title="Inspect Partner Wallet Ledger"
                        >
                          Wallet 
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
