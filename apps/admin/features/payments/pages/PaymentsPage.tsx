'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Text, trackAnalyticsEvent, useTheme } from 'foodie-shared-web';
import { GAP_API_17_PAYMENT_LIST } from '@/constants/gaps';

import { useAppSelector } from '@/store/hooks';
import { selectActiveModule } from '@/store/moduleSlice';

import type { CommissionConfig, PaymentSettlementRecord } from '../types';
import { calculatePaymentSplit } from '../types';

export interface WithdrawRequest {
  id: string;
  vendorName: string;
  module: string;
  amount: number;
  bankAccount: string;
  requestedDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const DEFAULT_COMMISSION_CONFIG: CommissionConfig = {
  restaurantCommissionRate: 15, // 15%
  deliveryCommissionRate: 10,   // 10%
  platformFixedFee: 40,         // ₹40
};

const MOCK_SETTLEMENTS: PaymentSettlementRecord[] = [
  {
    id: 'SETTL-901',
    paymentUuid: 'e28014a0-7612-4c22-951b-102948172631',
    orderId: 'ORD-8801',
    customerName: 'Sarah Jenkins',
    paymentMethod: 'RAZORPAY_UPI',
    totalPaid: 580,
    foodSubtotal: 450,
    deliveryFee: 90,
    adminTotalRevenue: 116.5, // 15% of 450 (67.5) + 10% of 90 (9) + 40
    restaurantNetShare: 382.5, // 450 - 67.5
    restaurantName: 'Royal Biryani House',
    deliveryPartnerNetShare: 81.0, // 90 - 9
    driverName: 'Rahul Sharma (Rider)',
    settlementStatus: 'FUNDS_DISTRIBUTED',
    settledAt: '2026-08-24 12:15',
  },
  {
    id: 'SETTL-902',
    paymentUuid: 'f49129b1-8723-4d33-a62c-203959283742',
    orderId: 'ORD-8802',
    customerName: 'Marcus Vance',
    paymentMethod: 'CREDIT_CARD',
    totalPaid: 440,
    foodSubtotal: 350,
    deliveryFee: 50,
    adminTotalRevenue: 97.5, // 15% of 350 (52.5) + 10% of 50 (5) + 40
    restaurantNetShare: 297.5, // 350 - 52.5
    restaurantName: 'Bella Italia Pizzeria',
    deliveryPartnerNetShare: 45.0, // 50 - 5
    driverName: 'Vikram Singh (Rider)',
    settlementStatus: 'FUNDS_DISTRIBUTED',
    settledAt: '2026-08-24 11:40',
  },
  {
    id: 'SETTL-903',
    paymentUuid: 'a10293c2-9834-4e44-b73d-304060394853',
    orderId: 'ORD-8803',
    customerName: 'Elena Rostova',
    paymentMethod: 'FOODIE_WALLET',
    totalPaid: 710,
    foodSubtotal: 600,
    deliveryFee: 70,
    adminTotalRevenue: 137.0, // 15% of 600 (90) + 10% of 70 (7) + 40
    restaurantNetShare: 510.0, // 600 - 90
    restaurantName: 'Sweet Dreams Bakery',
    deliveryPartnerNetShare: 63.0, // 70 - 7
    driverName: 'Anita Patel (Rider)',
    settlementStatus: 'FUNDS_DISTRIBUTED',
    settledAt: '2026-08-24 10:20',
  },
];

const MOCK_WITHDRAWS: WithdrawRequest[] = [
  {
    id: 'w101',
    vendorName: 'Royal Biryani House',
    module: 'North Indian & Biryani',
    amount: 24500,
    bankAccount: 'HDFC Bank •• 4321',
    requestedDate: '2026-08-24',
    status: 'PENDING',
  },
  {
    id: 'w102',
    vendorName: 'Bella Italia Pizzeria',
    module: 'Italian & Pizza',
    amount: 18900,
    bankAccount: 'ICICI Bank •• 8765',
    requestedDate: '2026-08-23',
    status: 'APPROVED',
  },
  {
    id: 'w103',
    vendorName: 'Sweet Dreams Bakery & Cafe',
    module: 'Bakery & Desserts',
    amount: 9800,
    bankAccount: 'SBI Bank •• 1092',
    requestedDate: '2026-08-22',
    status: 'PENDING',
  },
];

export function PaymentsPage() {
  const { tokens } = useTheme();
  const activeModule = useAppSelector(selectActiveModule);

  // Core Financial State
  const [commissionConfig, setCommissionConfig] = useState<CommissionConfig>(DEFAULT_COMMISSION_CONFIG);
  const [settlements, setSettlements] = useState<PaymentSettlementRecord[]>(MOCK_SETTLEMENTS);
  const [withdraws, setWithdraws] = useState<WithdrawRequest[]>(MOCK_WITHDRAWS);

  // Live Simulator Form State
  const [simCustomerName, setSimCustomerName] = useState('Arthur Pendelton');
  const [simFoodCost, setSimFoodCost] = useState('500');
  const [simDeliveryFee, setSimDeliveryFee] = useState('80');
  const [simRestaurantName, setSimRestaurantName] = useState('Artisan Burger Co.');
  const [simDriverName, setSimDriverName] = useState('Karan Kumar (Rider)');
  const [simPayMethod, setSimPayMethod] = useState<'RAZORPAY_UPI' | 'CREDIT_CARD' | 'FOODIE_WALLET'>('RAZORPAY_UPI');

  // Config Modal & Refund States
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configRestRate, setConfigRestRate] = useState(DEFAULT_COMMISSION_CONFIG.restaurantCommissionRate.toString());
  const [configDelivRate, setConfigDelivRate] = useState(DEFAULT_COMMISSION_CONFIG.deliveryCommissionRate.toString());
  const [configPlatformFee, setConfigPlatformFee] = useState(DEFAULT_COMMISSION_CONFIG.platformFixedFee.toString());

  const [refundPaymentUuid, setRefundPaymentUuid] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    trackAnalyticsEvent('admin_payments_viewed', {
      gapId: GAP_API_17_PAYMENT_LIST,
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Calculated Live Metrics
  const totalAdminEscrowPaid = settlements.reduce((acc, s) => acc + s.totalPaid, 0);
  const totalAdminNetRevenue = settlements.reduce((acc, s) => acc + s.adminTotalRevenue, 0);
  const totalDistributedToRestaurants = settlements.reduce((acc, s) => acc + s.restaurantNetShare, 0);
  const totalDistributedToDrivers = settlements.reduce((acc, s) => acc + s.deliveryPartnerNetShare, 0);

  // Live Simulator Handler
  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();

    const foodCostNum = Math.max(0, Number(simFoodCost) || 0);
    const deliveryFeeNum = Math.max(0, Number(simDeliveryFee) || 0);

    if (foodCostNum <= 0) {
      alert('Please enter a valid Food Subtotal amount');
      return;
    }

    const split = calculatePaymentSplit(foodCostNum, deliveryFeeNum, commissionConfig);

    const newOrderNum = 8800 + settlements.length + 1;
    const newSettlement: PaymentSettlementRecord = {
      id: `SETTL-90${settlements.length + 1}`,
      paymentUuid: crypto.randomUUID ? crypto.randomUUID() : `uuid-${Date.now()}`,
      orderId: `ORD-${newOrderNum}`,
      customerName: simCustomerName || 'Guest Customer',
      paymentMethod: simPayMethod,
      totalPaid: split.totalPaid,
      foodSubtotal: split.foodSubtotal,
      deliveryFee: split.deliveryFee,
      adminTotalRevenue: split.adminTotalRevenue,
      restaurantNetShare: split.restaurantNetShare,
      restaurantName: simRestaurantName || 'Partner Restaurant',
      deliveryPartnerNetShare: split.deliveryPartnerNetShare,
      driverName: simDriverName || 'Delivery Partner',
      settlementStatus: 'FUNDS_DISTRIBUTED',
      settledAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    };

    setSettlements((prev) => [newSettlement, ...prev]);

    showToast(
      ` Customer Payment ₹${split.totalPaid.toFixed(2)} Credited to Admin Escrow! Auto-Split: Admin ₹${split.adminTotalRevenue.toFixed(2)} | Restaurant ₹${split.restaurantNetShare.toFixed(2)} | Driver ₹${split.deliveryPartnerNetShare.toFixed(2)}`
    );
  };

  const handleSaveConfig = () => {
    const rRate = Math.min(100, Math.max(0, Number(configRestRate) || 0));
    const dRate = Math.min(100, Math.max(0, Number(configDelivRate) || 0));
    const pFee = Math.max(0, Number(configPlatformFee) || 0);

    setCommissionConfig({
      restaurantCommissionRate: rRate,
      deliveryCommissionRate: dRate,
      platformFixedFee: pFee,
    });

    setIsConfigOpen(false);
    showToast(`Updated Commission Rules: Restaurant ${rRate}%, Delivery ${dRate}%, Platform Fee ₹${pFee}`);
  };

  const handleApproveWithdraw = (id: string) => {
    setWithdraws((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'APPROVED' } : w))
    );
    showToast('Vendor withdrawal request approved and disbursed!');
  };

  const handleProcessRefund = () => {
    if (!refundPaymentUuid.trim()) {
      alert('Please enter a valid Payment UUID');
      return;
    }
    showToast(`Refund of ₹${refundAmount || '0'} processed for Payment UUID: ${refundPaymentUuid.slice(0, 8)}...`);
    setRefundPaymentUuid('');
    setRefundAmount('');
    setRefundReason('');
  };

  // Preview calculation for live simulator
  const livePreviewSplit = calculatePaymentSplit(
    Number(simFoodCost) || 0,
    Number(simDeliveryFee) || 0,
    commissionConfig
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Alert */}
      {toastMsg ? (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: '#0F3D21',
            color: '#F59E0B',
            padding: '14px 24px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: 14,
            boxShadow: '0 8px 24px rgba(15,61,33,0.3)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}></span>
          <span>{toastMsg}</span>
        </div>
      ) : null}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Text as="h1" variant="heading1" color="#0F3D21" style={{ margin: 0 }}>
             Admin Central Escrow & Automatic Commission Settlement
          </Text>
          <Text as="p" variant="caption" color="#64748B" style={{ margin: '4px 0 0' }}>
            Customer payments credit 100% directly to Admin Account and auto-distribute to Restaurants and Delivery Partners based on commission rates.
          </Text>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href="/delivery-payouts"
            style={{
              backgroundColor: '#15803D',
              color: '#FFFFFF',
              border: 'none',
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(21, 128, 61, 0.25)',
              textDecoration: 'none',
            }}
          >
            <span></span> Delivery Partner Payouts & Reconciliation
          </Link>

          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            style={{
              backgroundColor: '#0F3D21',
              color: '#F59E0B',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              padding: '10px 18px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(15,61,33,0.2)',
            }}
          >
            <span></span> Configure Commission Rates
          </button>
        </div>
      </div>

      {/* Financial Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #0F3D21',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <Text as="span" variant="caption" color="#64748B" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
            Admin Escrow Collection Pool
          </Text>
          <Text as="h2" variant="heading1" color="#0F3D21" style={{ marginTop: 4, fontWeight: 800 }}>
            ₹{totalAdminEscrowPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
          <div style={{ fontSize: 11, color: '#166534', fontWeight: 700, marginTop: 4 }}>
            ● 100% Customer Bill Direct Collections
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #F59E0B',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <Text as="span" variant="caption" color="#64748B" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
            Total Admin Net Commission
          </Text>
          <Text as="h2" variant="heading1" color="#D97706" style={{ marginTop: 4, fontWeight: 800 }}>
            ₹{totalAdminNetRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
          <div style={{ fontSize: 11, color: '#D97706', fontWeight: 700, marginTop: 4 }}>
            Platform Fee ({commissionConfig.platformFixedFee}) + {commissionConfig.restaurantCommissionRate}% Rest. Comm.
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #059669',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <Text as="span" variant="caption" color="#64748B" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
            Distributed to Restaurants
          </Text>
          <Text as="h2" variant="heading1" color="#059669" style={{ marginTop: 4, fontWeight: 800 }}>
            ₹{totalDistributedToRestaurants.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
          <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 4 }}>
            Net Food Earnings Credited to Vendors
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #2563EB',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <Text as="span" variant="caption" color="#64748B" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
            Distributed to Delivery Partners
          </Text>
          <Text as="h2" variant="heading1" color="#2563EB" style={{ marginTop: 4, fontWeight: 800 }}>
            ₹{totalDistributedToDrivers.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
          <div style={{ fontSize: 11, color: '#2563EB', fontWeight: 700, marginTop: 4 }}>
            Net Delivery Fees Credited to Riders
          </div>
        </div>
      </div>

      {/* SECTION 1: CUSTOMER PAYMENT & AUTO-SPLIT SIMULATOR */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          padding: 24,
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F3D21', margin: 0 }}>
               Customer Payment & Commission Auto-Split Simulator
            </h2>
            <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
              Simulate a customer order payment to verify instant credit to Admin Escrow and automatic split calculation.
            </p>
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#FEF3C7', color: '#B45309', padding: '4px 10px', borderRadius: 8 }}>
            ACTIVE RULES: Rest {commissionConfig.restaurantCommissionRate}% | Delivery {commissionConfig.deliveryCommissionRate}% | Fee ₹{commissionConfig.platformFixedFee}
          </span>
        </div>

        <form onSubmit={handleSimulatePayment} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {/* Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Customer Name
              </label>
              <input
                type="text"
                value={simCustomerName}
                onChange={(e) => setSimCustomerName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Food Subtotal (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={simFoodCost}
                  onChange={(e) => setSimFoodCost(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Delivery Fee (₹)
                </label>
                <input
                  type="number"
                  value={simDeliveryFee}
                  onChange={(e) => setSimDeliveryFee(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Restaurant Store Name
                </label>
                <input
                  type="text"
                  value={simRestaurantName}
                  onChange={(e) => setSimRestaurantName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Assigned Rider Name
                </label>
                <input
                  type="text"
                  value={simDriverName}
                  onChange={(e) => setSimDriverName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Payment Gateway / Method
              </label>
              <select
                value={simPayMethod}
                onChange={(e) => setSimPayMethod(e.target.value as any)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600 }}
              >
                <option value="RAZORPAY_UPI">Razorpay UPI / Instant</option>
                <option value="CREDIT_CARD">Credit / Debit Card</option>
                <option value="FOODIE_WALLET">Foodie Customer Wallet</option>
              </select>
            </div>
          </div>

          {/* Live Auto-Split Breakdown Preview */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 14,
              border: '1px solid #E2E8F0',
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#0F3D21', textTransform: 'uppercase', marginBottom: 10 }}>
                 Calculated Auto-Split Breakdown
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #CBD5E1', paddingBottom: 6 }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Total Paid by Customer (100% Admin Escrow):</span>
                  <span style={{ fontWeight: 800, color: '#0F3D21' }}>₹{livePreviewSplit.totalPaid.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', fontWeight: 700 }}>
                  <span> Admin Net Commission Revenue:</span>
                  <span>₹{livePreviewSplit.adminTotalRevenue.toFixed(2)}</span>
                </div>

                <div style={{ fontSize: 11, color: '#94A3B8', paddingLeft: 12, marginTop: -4 }}>
                  • Rest. Comm ({commissionConfig.restaurantCommissionRate}%): ₹{livePreviewSplit.adminFoodCommission.toFixed(2)}
                  <br />
                  • Delivery Comm ({commissionConfig.deliveryCommissionRate}%): ₹{livePreviewSplit.adminDeliveryCommission.toFixed(2)}
                  <br />
                  • Fixed Platform Fee: ₹{livePreviewSplit.platformFee.toFixed(2)}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 700, paddingTop: 4 }}>
                  <span> Restaurant Net Wallet Distribution:</span>
                  <span>₹{livePreviewSplit.restaurantNetShare.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2563EB', fontWeight: 700 }}>
                  <span> Delivery Partner Net Wallet Distribution:</span>
                  <span>₹{livePreviewSplit.deliveryPartnerNetShare.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: '#0F3D21',
                color: '#F59E0B',
                border: 'none',
                padding: '12px 18px',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(15,61,33,0.25)',
                transition: 'all 0.15s ease',
              }}
            >
               Pay Bill & Auto-Distribute Funds
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: LIVE PAYMENT SETTLEMENT LEDGER */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text as="h2" variant="heading3" color="#0F3D21" style={{ margin: 0 }}>
               Live Payment Settlement & Distribution Ledger
            </Text>
            <Text as="p" variant="caption" color="#64748B" style={{ margin: '2px 0 0' }}>
              Real-time audit log of customer bill payments credited to Admin Escrow and split to stakeholders.
            </Text>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0F3D21', backgroundColor: '#DCFCE7', padding: '4px 10px', borderRadius: 20 }}>
            ● {settlements.length} Settlements Processed
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#475569', backgroundColor: '#F8FAFC' }}>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Settlement / Order</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Customer</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Total Paid (Admin Escrow)</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Admin Net Commission</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Restaurant Share</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Delivery Partner Share</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 700 }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 800, color: '#0F3D21' }}>{s.orderId}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{s.id}</div>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#1E293B' }}>{s.customerName}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{s.paymentMethod}</div>
                  </td>

                  <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F3D21' }}>
                    ₹{s.totalPaid.toFixed(2)}
                  </td>

                  <td style={{ padding: '14px 16px', fontWeight: 800, color: '#D97706' }}>
                    +₹{s.adminTotalRevenue.toFixed(2)}
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 800, color: '#059669' }}>+₹{s.restaurantNetShare.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{s.restaurantName}</div>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 800, color: '#2563EB' }}>+₹{s.deliveryPartnerNetShare.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{s.driverName}</div>
                  </td>

                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        backgroundColor: '#DCFCE7',
                        color: '#166534',
                        fontSize: 10,
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 20,
                        border: '1px solid #86EFAC',
                      }}
                    >
                      ● FUNDS DISTRIBUTED
                    </span>
                  </td>

                  <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748B' }}>
                    {s.settledAt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3 & 4: VENDOR WITHDRAWALS & REFUND PROCESSING */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 24 }}>
        {/* Vendor Withdrawal Requests Table */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <Text as="h2" variant="heading3" color="#0F3D21">
               Vendor & Delivery Partner Payout Requests
            </Text>
            <Text as="p" variant="caption" color="#64748B">
              Withdrawal requests from restaurants and riders to disburse their accumulated wallet earnings.
            </Text>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
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
                      <div style={{ fontWeight: 700, color: '#0F3D21' }}>{w.vendorName}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{w.module} • {w.requestedDate}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 800, color: '#0F3D21' }}>
                      ₹{w.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#475569', fontSize: 12 }}>{w.bankAccount}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          backgroundColor: w.status === 'APPROVED' ? '#DCFCE7' : '#FEF3C7',
                          color: w.status === 'APPROVED' ? '#166534' : '#B45309',
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
                            backgroundColor: '#0F3D21',
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
            borderRadius: 16,
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
            <Text as="h2" variant="heading3" color="#0F3D21" style={{ margin: 0 }}>
               Issue Payment Refund
            </Text>
            <Text as="p" variant="caption" color="#64748B" style={{ margin: '2px 0 0' }}>
              Process direct refunds to customer account by Payment UUID (GAP-API-17)
            </Text>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0F3D21' }}>Payment UUID</label>
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
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0F3D21' }}>Refund Amount (₹)</label>
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
            <label style={{ fontSize: 12, fontWeight: 700, color: '#0F3D21' }}>Audit Reason</label>
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
              color: '#0F3D21',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginTop: 8,
            }}
          >
            Execute Refund
          </button>
        </div>
      </div>

      {/* CONFIGURATION MODAL */}
      {isConfigOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 24,
              maxWidth: 460,
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F3D21', margin: 0 }}>
                 Configure Commission & Fee Rules
              </h3>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }}
              >
                
              </button>
            </div>

            <p style={{ fontSize: 12, color: '#475569', margin: 0 }}>
              Adjust global platform commission rates applied to incoming customer bill payments.
            </p>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Restaurant Food Commission Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={configRestRate}
                onChange={(e) => setConfigRestRate(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
              />
              <span style={{ fontSize: 11, color: '#64748B' }}>Deducted from restaurant food item subtotal</span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Delivery Partner Commission Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={configDelivRate}
                onChange={(e) => setConfigDelivRate(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
              />
              <span style={{ fontSize: 11, color: '#64748B' }}>Deducted from order delivery fee payout</span>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Platform Fixed Service Fee (₹ per order)
              </label>
              <input
                type="number"
                min="0"
                value={configPlatformFee}
                onChange={(e) => setConfigPlatformFee(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
              />
              <span style={{ fontSize: 11, color: '#64748B' }}>Retained 100% by Admin per transaction</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#0F3D21',
                  color: '#F59E0B',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                Save Rules
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
