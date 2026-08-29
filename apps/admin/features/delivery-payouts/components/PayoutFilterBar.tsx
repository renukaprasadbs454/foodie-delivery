'use client';

import React from 'react';
import type { PayoutFilterOptions, PayoutProvider, PayoutStatus } from '../types';

interface PayoutFilterBarProps {
  filters: PayoutFilterOptions;
  onChange: (newFilters: PayoutFilterOptions) => void;
  onReset: () => void;
}

export function PayoutFilterBar({ filters, onChange, onReset }: PayoutFilterBarProps) {
  const handleTextChange = (field: keyof PayoutFilterOptions, value: string) => {
    onChange({ ...filters, [field]: value });
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: '18px 20px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          alignItems: 'end',
        }}
      >
        {/* Partner Search */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            Delivery Partner
          </label>
          <input
            type="text"
            placeholder="Search partner name, phone or ID..."
            value={filters.partnerQuery}
            onChange={(e) => handleTextChange('partnerQuery', e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              outline: 'none',
            }}
          />
        </div>

        {/* Payout ID Search */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            Payout ID
          </label>
          <input
            type="text"
            placeholder="e.g. PO-8901..."
            value={filters.payoutId}
            onChange={(e) => handleTextChange('payoutId', e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              outline: 'none',
            }}
          />
        </div>

        {/* Status Dropdown */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleTextChange('status', e.target.value as PayoutStatus | 'ALL')}
            style={{
              width: '100%',
              padding: '9px 12px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="REQUESTED">REQUESTED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        {/* Provider Dropdown */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            Provider
          </label>
          <select
            value={filters.provider}
            onChange={(e) => handleTextChange('provider', e.target.value as PayoutProvider | 'ALL')}
            style={{
              width: '100%',
              padding: '9px 12px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Providers</option>
            <option value="RAZORPAY">Razorpay</option>
            <option value="CASHFREE">Cashfree</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            From Date
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleTextChange('dateFrom', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              outline: 'none',
            }}
          />
        </div>

        {/* Date To */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
            To Date
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleTextChange('dateTo', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
        <button
          type="button"
          onClick={onReset}
          style={{
            padding: '7px 16px',
            fontSize: 12,
            fontWeight: 700,
            color: '#64748B',
            backgroundColor: '#F1F5F9',
            border: '1px solid #CBD5E1',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
