'use client';

import React, { useEffect, useState } from 'react';
import { Text, trackAnalyticsEvent, useTheme } from 'foodie-shared-web';
import { GAP_API_19_COUPON_LIST } from '@/constants/gaps';

import { useAppSelector } from '@/store/hooks';
import { selectActiveModule } from '@/store/moduleSlice';

export interface CouponRecord {
  id: string;
  code: string;
  title: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minPurchase: number;
  maxDiscount: number;
  module: string;
  expiryDate: string;
  status: 'ACTIVE' | 'DEACTIVATED';
}

const MOCK_COUPONS: CouponRecord[] = [
  {
    id: 'c111',
    code: 'FOODIE50',
    title: '50% OFF Super Meal Deal',
    discountType: 'PERCENT',
    discountValue: 50,
    minPurchase: 300,
    maxDiscount: 150,
    module: 'All Food Delivery',
    expiryDate: '2025-12-31',
    status: 'ACTIVE',
  },
  {
    id: 'c222',
    code: 'PIZZA100',
    title: '₹100 Flat Savings on Italian Pizzerias',
    discountType: 'FIXED',
    discountValue: 100,
    minPurchase: 500,
    maxDiscount: 100,
    module: 'Fine Dining & Pizzerias',
    expiryDate: '2025-10-15',
    status: 'ACTIVE',
  },
  {
    id: 'c333',
    code: 'SWEETS20',
    title: '20% OFF Bakery & Desserts',
    discountType: 'PERCENT',
    discountValue: 20,
    minPurchase: 400,
    maxDiscount: 200,
    module: 'Cafes & Bakery',
    expiryDate: '2025-09-30',
    status: 'DEACTIVATED',
  },
];

export function CouponsPage() {
  const { tokens } = useTheme();
  const activeModule = useAppSelector(selectActiveModule);
  const [coupons, setCoupons] = useState<CouponRecord[]>(MOCK_COUPONS);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [module, setModule] = useState('All Food Delivery');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    trackAnalyticsEvent('admin_coupons_viewed', {
      gapId: GAP_API_19_COUPON_LIST,
    });
  }, []);

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !discountValue.trim()) {
      alert('Please fill out coupon code and discount value');
      return;
    }
    const newCoupon: CouponRecord = {
      id: `c${Date.now().toString().slice(-4)}`,
      code: code.trim().toUpperCase(),
      title: title.trim() || `${code.trim().toUpperCase()} Promo`,
      discountType,
      discountValue: Number(discountValue),
      minPurchase: Number(minPurchase) || 0,
      maxDiscount: discountType === 'PERCENT' ? 200 : Number(discountValue),
      module,
      expiryDate: '2025-12-31',
      status: 'ACTIVE',
    };
    setCoupons((prev) => [newCoupon, ...prev]);
    setCode('');
    setTitle('');
    setDiscountValue('');
    setMinPurchase('');
    setToastMsg(`Coupon code ${newCoupon.code} created successfully!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleToggleStatus = (id: string) => {
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE' }
          : c,
      ),
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <Text as="h1" variant="heading1" color="#14532D">
          Campaigns & Promo Coupons
        </Text>
        <Text as="p" variant="caption" color="#64748B">
          Create promotional voucher codes, set minimum purchase thresholds & manage active discounts
        </Text>
      </div>

      {/* Grid: Create Coupon Form + Coupon Directory */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
        {/* Create Coupon Form */}
        <form
          onSubmit={handleCreateCoupon}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #14532D',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            height: 'fit-content',
          }}
        >
          <Text as="h2" variant="heading3" color="#14532D">
            Create Promo Coupon
          </Text>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Coupon Code</label>
            <input
              type="text"
              placeholder="e.g. FOODIE50"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', textTransform: 'uppercase' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Campaign Title</label>
            <input
              type="text"
              placeholder="e.g. 50% OFF Super Meal Deal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Discount Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'PERCENT' | 'FIXED')}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
              >
                <option value="PERCENT">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Value</label>
              <input
                type="number"
                placeholder="e.g. 50"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Target Food Category</label>
            <select
              value={module}
              onChange={(e) => setModule(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
            >
              <option value="All Food Delivery">All Food Delivery</option>
              <option value="Fine Dining & Pizzerias">Fine Dining & Pizzerias</option>
              <option value="Cafes & Bakery">Cafes & Bakery</option>
              <option value="Cloud Kitchens">Cloud Kitchens</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Minimum Purchase (₹)</label>
            <input
              type="number"
              placeholder="e.g. 300"
              value={minPurchase}
              onChange={(e) => setMinPurchase(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
            />
          </div>

          <button
            type="submit"
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
            Create Coupon
          </button>
        </form>

        {/* Coupons Directory Table */}
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
              Active Promo Coupons
            </Text>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 12 }}>
                <th style={{ padding: '12px 20px' }}>Code & Title</th>
                <th style={{ padding: '12px 20px' }}>Discount</th>
                <th style={{ padding: '12px 20px' }}>Min Purchase</th>
                <th style={{ padding: '12px 20px' }}>Module</th>
                <th style={{ padding: '12px 20px' }}>Expiry</th>
                <th style={{ padding: '12px 20px' }}>Status</th>
                <th style={{ padding: '12px 20px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {coupons
                .filter((c) => {
                  if (activeModule === 'FOOD') return true;
                  if (activeModule === 'RESTAURANTS') return c.module.includes('Fine Dining') || c.module.includes('Pizza') || c.module.includes('All');
                  if (activeModule === 'CAFES') return c.module.includes('Bakery') || c.module.includes('Cafes') || c.module.includes('All');
                  if (activeModule === 'CLOUD_KITCHEN') return c.module.includes('Cloud') || c.module.includes('All');
                  return true;
                })
                .map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 800, color: '#14532D', fontFamily: 'monospace' }}>🏷️ {c.code}</div>
                    <div style={{ fontSize: 12, color: '#475569' }}>{c.title}</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 800, color: '#D97706' }}>
                    {c.discountType === 'PERCENT' ? `${c.discountValue}% OFF` : `₹${c.discountValue} FLAT`}
                  </td>
                  <td style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>
                    ₹{c.minPurchase}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, backgroundColor: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: 4 }}>
                      {c.module}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#64748B', fontSize: 12 }}>{c.expiryDate}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        backgroundColor: c.status === 'ACTIVE' ? '#D1FAE5' : '#FEE2E2',
                        color: c.status === 'ACTIVE' ? '#047857' : '#B91C1C',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '4px 8px',
                        borderRadius: 20,
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(c.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: c.status === 'ACTIVE' ? '#FEE2E2' : '#D1FAE5',
                        color: c.status === 'ACTIVE' ? '#991B1B' : '#047857',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {c.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          🏷️ {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
