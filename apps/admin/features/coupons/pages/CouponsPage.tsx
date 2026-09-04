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

export interface FirstOrderOfferRecord {
  id: string;
  code: string;
  title: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minPurchase: number;
  totalClaims: number;
  status: 'ACTIVE' | 'DEACTIVATED';
}

export interface CampaignRecord {
  id: string;
  title: string;
  bannerOffer: string;
  category: string;
  startDate: string;
  endDate: string;
  budget: number;
  totalOrders: number;
  status: 'LIVE' | 'SCHEDULED' | 'ENDED';
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

const MOCK_FIRST_ORDER_OFFERS: FirstOrderOfferRecord[] = [
  {
    id: 'fo-101',
    code: 'FIRST50',
    title: '50% OFF Welcome Bonus on First Order',
    discountType: 'PERCENT',
    discountValue: 50,
    minPurchase: 200,
    totalClaims: 980,
    status: 'ACTIVE',
  },
  {
    id: 'fo-102',
    code: 'WELCOME100',
    title: '₹100 Flat Discount for New Users',
    discountType: 'FIXED',
    discountValue: 100,
    minPurchase: 350,
    totalClaims: 500,
    status: 'ACTIVE',
  },
];

const MOCK_CAMPAIGNS: CampaignRecord[] = [
  {
    id: 'cmp-201',
    title: 'Diwali Feast & Culinary Gala 2025',
    bannerOffer: 'Up to 60% OFF + Free Delivery on Family Combos',
    category: 'All Food Delivery',
    startDate: '2025-10-20',
    endDate: '2025-11-05',
    budget: 250000,
    totalOrders: 4120,
    status: 'LIVE',
  },
  {
    id: 'cmp-202',
    title: 'Weekend Pizza & Burger Mania',
    bannerOffer: 'Buy 1 Get 1 Free on Select Gourmet Outlets',
    category: 'Fine Dining & Pizzerias',
    startDate: '2025-09-01',
    endDate: '2025-09-30',
    budget: 120000,
    totalOrders: 2850,
    status: 'LIVE',
  },
  {
    id: 'cmp-203',
    title: 'Monsoon Chai & Snack Bonanza',
    bannerOffer: 'Flat 30% OFF on Bakery & Cafes',
    category: 'Cafes & Bakery',
    startDate: '2025-07-01',
    endDate: '2025-08-15',
    budget: 80000,
    totalOrders: 1950,
    status: 'ENDED',
  },
];

type CouponTab = 'PROMO_COUPONS' | 'FIRST_ORDER_OFFERS' | 'REFERRAL_OFFERS' | 'CAMPAIGN_MANAGEMENT';

export function CouponsPage() {
  const { tokens } = useTheme();
  const activeModule = useAppSelector(selectActiveModule);

  const [activeTab, setActiveTab] = useState<CouponTab>('PROMO_COUPONS');
  const [coupons, setCoupons] = useState<CouponRecord[]>(MOCK_COUPONS);
  const [firstOrderOffers, setFirstOrderOffers] = useState<FirstOrderOfferRecord[]>(MOCK_FIRST_ORDER_OFFERS);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>(MOCK_CAMPAIGNS);

  // Form State - Coupon
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [module, setModule] = useState('All Food Delivery');

  // Form State - First Order Offer
  const [foCode, setFoCode] = useState('');
  const [foTitle, setFoTitle] = useState('');
  const [foValue, setFoValue] = useState('');
  const [foMinPurchase, setFoMinPurchase] = useState('');

  // Form State - Referral Settings
  const [referrerBonus, setReferrerBonus] = useState('100');
  const [refereeBonus, setRefereeBonus] = useState('100');
  const [referralMinOrder, setReferralMinOrder] = useState('300');
  const [isReferralActive, setIsReferralActive] = useState(true);

  // Form State - Campaign
  const [cmpTitle, setCmpTitle] = useState('');
  const [cmpBanner, setCmpBanner] = useState('');
  const [cmpCategory, setCmpCategory] = useState('All Food Delivery');
  const [cmpBudget, setCmpBudget] = useState('');

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

  const handleCreateFirstOrderOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foCode.trim() || !foValue.trim()) {
      alert('Please fill out First Order Offer Code and Discount Value.');
      return;
    }
    const newOffer: FirstOrderOfferRecord = {
      id: `fo-${Date.now().toString().slice(-4)}`,
      code: foCode.trim().toUpperCase(),
      title: foTitle.trim() || `${foCode.trim().toUpperCase()} Welcome Deal`,
      discountType: 'PERCENT',
      discountValue: Number(foValue),
      minPurchase: Number(foMinPurchase) || 200,
      totalClaims: 0,
      status: 'ACTIVE',
    };
    setFirstOrderOffers((prev) => [newOffer, ...prev]);
    setFoCode('');
    setFoTitle('');
    setFoValue('');
    setFoMinPurchase('');
    setToastMsg(`First Order Offer ${newOffer.code} activated!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmpTitle.trim() || !cmpBanner.trim()) {
      alert('Please provide Campaign Title and Banner Offer details.');
      return;
    }
    const newCampaign: CampaignRecord = {
      id: `cmp-${Date.now().toString().slice(-4)}`,
      title: cmpTitle.trim(),
      bannerOffer: cmpBanner.trim(),
      category: cmpCategory,
      startDate: '2025-10-01',
      endDate: '2025-10-31',
      budget: Number(cmpBudget) || 100000,
      totalOrders: 0,
      status: 'LIVE',
    };
    setCampaigns((prev) => [newCampaign, ...prev]);
    setCmpTitle('');
    setCmpBanner('');
    setCmpBudget('');
    setToastMsg(`Campaign "${newCampaign.title}" launched successfully!`);
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Text as="h1" variant="heading1" color="#14532D">
            Campaigns, Offers & Promo Vouchers
          </Text>
          <Text as="p" variant="caption" color="#64748B">
            Manage promotional coupons, first-order welcome offers, referral rewards & seasonal campaigns
          </Text>
        </div>
      </div>

      {/* Feature Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          backgroundColor: '#FFFFFF',
          padding: '8px',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('PROMO_COUPONS')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: activeTab === 'PROMO_COUPONS' ? '#14532D' : 'transparent',
            color: activeTab === 'PROMO_COUPONS' ? '#F59E0B' : '#475569',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Promo Coupons ({coupons.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('FIRST_ORDER_OFFERS')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: activeTab === 'FIRST_ORDER_OFFERS' ? '#14532D' : 'transparent',
            color: activeTab === 'FIRST_ORDER_OFFERS' ? '#F59E0B' : '#475569',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          First Order Offers ({firstOrderOffers.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('REFERRAL_OFFERS')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: activeTab === 'REFERRAL_OFFERS' ? '#14532D' : 'transparent',
            color: activeTab === 'REFERRAL_OFFERS' ? '#F59E0B' : '#475569',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Referral Offers
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CAMPAIGN_MANAGEMENT')}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: activeTab === 'CAMPAIGN_MANAGEMENT' ? '#14532D' : 'transparent',
            color: activeTab === 'CAMPAIGN_MANAGEMENT' ? '#F59E0B' : '#475569',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Campaign Management ({campaigns.length})
        </button>
      </div>

      {/* TAB 1: PROMO COUPONS */}
      {activeTab === 'PROMO_COUPONS' && (
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
                      <div style={{ fontWeight: 800, color: '#14532D', fontFamily: 'monospace' }}> {c.code}</div>
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
      )}

      {/* TAB 2: FIRST ORDER OFFERS */}
      {activeTab === 'FIRST_ORDER_OFFERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: 12, border: '1px solid #E2E8F0', borderTop: '4px solid #14532D' }}>
              <div style={{ fontSize: 12, color: '#64748B' }}>Active First-Order Deals</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#14532D', marginTop: 4 }}>{firstOrderOffers.length}</div>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: 12, border: '1px solid #E2E8F0', borderTop: '4px solid #F59E0B' }}>
              <div style={{ fontSize: 12, color: '#64748B' }}>Total New User Claims</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', marginTop: 4 }}>1,480 Claims</div>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: 12, border: '1px solid #E2E8F0', borderTop: '4px solid #10B981' }}>
              <div style={{ fontSize: 12, color: '#64748B' }}>New Customer Conversion Boost</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#047857', marginTop: 4 }}>+24.8%</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
            {/* Create First Order Offer Form */}
            <form
              onSubmit={handleCreateFirstOrderOffer}
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
              }}
            >
              <Text as="h2" variant="heading3" color="#14532D">
                Create First Order Offer
              </Text>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Promo Code *</label>
                <input
                  type="text"
                  placeholder="e.g. FIRST50"
                  value={foCode}
                  onChange={(e) => setFoCode(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', textTransform: 'uppercase' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Offer Title</label>
                <input
                  type="text"
                  placeholder="e.g. 50% OFF Welcome Bonus on First Order"
                  value={foTitle}
                  onChange={(e) => setFoTitle(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Discount % *</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={foValue}
                    onChange={(e) => setFoValue(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                    required
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Min Order (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 200"
                    value={foMinPurchase}
                    onChange={(e) => setFoMinPurchase(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  padding: '12px 18px',
                  backgroundColor: '#14532D',
                  color: '#F59E0B',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                Activate First Order Offer
              </button>
            </form>

            {/* First Order Offers List */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                <Text as="h2" variant="heading3" color="#14532D">
                  Active First Order Offers Directory
                </Text>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 12 }}>
                    <th style={{ padding: '12px 20px' }}>Code & Deal</th>
                    <th style={{ padding: '12px 20px' }}>Discount</th>
                    <th style={{ padding: '12px 20px' }}>Min Order</th>
                    <th style={{ padding: '12px 20px' }}>Total Claims</th>
                    <th style={{ padding: '12px 20px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {firstOrderOffers.map((fo) => (
                    <tr key={fo.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 800, color: '#14532D', fontFamily: 'monospace' }}> {fo.code}</div>
                        <div style={{ fontSize: 12, color: '#475569' }}>{fo.title}</div>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#D97706' }}>
                        {fo.discountType === 'PERCENT' ? `${fo.discountValue}% OFF` : `₹${fo.discountValue} FLAT`}
                      </td>
                      <td style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>₹{fo.minPurchase}</td>
                      <td style={{ padding: '16px 20px', color: '#14532D', fontWeight: 700 }}>{fo.totalClaims} redemptions</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ backgroundColor: '#D1FAE5', color: '#047857', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>
                          {fo.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REFERRAL OFFERS */}
      {activeTab === 'REFERRAL_OFFERS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: 12, border: '1px solid #E2E8F0', borderTop: '4px solid #14532D' }}>
              <div style={{ fontSize: 12, color: '#64748B' }}>Referral Status</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: isReferralActive ? '#047857' : '#DC2626', marginTop: 4 }}>
                {isReferralActive ? ' Active Campaign' : ' Paused'}
              </div>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: 12, border: '1px solid #E2E8F0', borderTop: '4px solid #F59E0B' }}>
              <div style={{ fontSize: 12, color: '#64748B' }}>Total Successful Referrals</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', marginTop: 4 }}>3,240 Users</div>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: 12, border: '1px solid #E2E8F0', borderTop: '4px solid #3B82F6' }}>
              <div style={{ fontSize: 12, color: '#64748B' }}>Total Referral Cash Paid</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1D4ED8', marginTop: 4 }}>₹3,24,000</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 24 }}>
            {/* Referral Campaign Configurator */}
            <div
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
              }}
            >
              <Text as="h2" variant="heading3" color="#14532D">
                Referral Program Settings
              </Text>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Referrer Reward (₹)</label>
                <input
                  type="number"
                  value={referrerBonus}
                  onChange={(e) => setReferrerBonus(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Referee Signup Bonus (₹)</label>
                <input
                  type="number"
                  value={refereeBonus}
                  onChange={(e) => setRefereeBonus(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Min Order Value for Reward (₹)</label>
                <input
                  type="number"
                  value={referralMinOrder}
                  onChange={(e) => setReferralMinOrder(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setToastMsg('Referral program settings updated successfully!');
                  setTimeout(() => setToastMsg(null), 3000);
                }}
                style={{
                  padding: '12px 18px',
                  backgroundColor: '#14532D',
                  color: '#F59E0B',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                Save Referral Configuration
              </button>
            </div>

            {/* Top Referral Champions Table */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                <Text as="h2" variant="heading3" color="#14532D">
                  Top Referral Champions
                </Text>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 12 }}>
                    <th style={{ padding: '12px 20px' }}>User Name</th>
                    <th style={{ padding: '12px 20px' }}>Referral Code</th>
                    <th style={{ padding: '12px 20px' }}>Friends Joined</th>
                    <th style={{ padding: '12px 20px' }}>Rewards Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Priya Sundaram', code: 'PRIYA100', count: 48, earned: '₹4,800' },
                    { name: 'Karthik Raja', code: 'KARTHIK01', count: 35, earned: '₹3,500' },
                    { name: 'Divya Nambiar', code: 'DIVYA99', count: 29, earned: '₹2,900' },
                  ].map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#14532D' }}>{row.name}</td>
                      <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 700, color: '#D97706' }}> {row.code}</td>
                      <td style={{ padding: '16px 20px', color: '#334155', fontWeight: 600 }}>{row.count} referred</td>
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#047857' }}>{row.earned}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CAMPAIGN MANAGEMENT */}
      {activeTab === 'CAMPAIGN_MANAGEMENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: 12, border: '1px solid #E2E8F0', borderTop: '4px solid #14532D' }}>
              <div style={{ fontSize: 12, color: '#64748B' }}>Live Marketing Campaigns</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#14532D', marginTop: 4 }}>
                {campaigns.filter((c) => c.status === 'LIVE').length} Running
              </div>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: 12, border: '1px solid #E2E8F0', borderTop: '4px solid #F59E0B' }}>
              <div style={{ fontSize: 12, color: '#64748B' }}>Total Campaign Orders</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#D97706', marginTop: 4 }}>8,920 Orders</div>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: 12, border: '1px solid #E2E8F0', borderTop: '4px solid #10B981' }}>
              <div style={{ fontSize: 12, color: '#64748B' }}>Campaign Revenue Driven</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#047857', marginTop: 4 }}>₹48.5 Lakhs</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
            {/* Create Campaign Form */}
            <form
              onSubmit={handleCreateCampaign}
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
              }}
            >
              <Text as="h2" variant="heading3" color="#14532D">
                Launch Promotional Campaign
              </Text>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Campaign Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Diwali Super Feast Gala 2025"
                  value={cmpTitle}
                  onChange={(e) => setCmpTitle(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Banner Offer Details *</label>
                <input
                  type="text"
                  placeholder="e.g. Up to 60% OFF + Free Delivery"
                  value={cmpBanner}
                  onChange={(e) => setCmpBanner(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Category / Outlets</label>
                <select
                  value={cmpCategory}
                  onChange={(e) => setCmpCategory(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                >
                  <option value="All Food Delivery">All Food Delivery</option>
                  <option value="Fine Dining & Pizzerias">Fine Dining & Pizzerias</option>
                  <option value="Cafes & Bakery">Cafes & Bakery</option>
                  <option value="Cloud Kitchens">Cloud Kitchens</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Marketing Budget (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 150000"
                  value={cmpBudget}
                  onChange={(e) => setCmpBudget(e.target.value)}
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
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                 Launch Marketing Campaign
              </button>
            </form>

            {/* Campaign Directory Table */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                <Text as="h2" variant="heading3" color="#14532D">
                  Marketing Campaigns Directory
                </Text>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 12 }}>
                    <th style={{ padding: '12px 20px' }}>Campaign Title & Offer</th>
                    <th style={{ padding: '12px 20px' }}>Category</th>
                    <th style={{ padding: '12px 20px' }}>Budget</th>
                    <th style={{ padding: '12px 20px' }}>Orders Driven</th>
                    <th style={{ padding: '12px 20px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((cmp) => (
                    <tr key={cmp.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 800, color: '#14532D' }}> {cmp.title}</div>
                        <div style={{ fontSize: 12, color: '#D97706', fontWeight: 600 }}>{cmp.bannerOffer}</div>
                      </td>
                      <td style={{ padding: '16px 20px', color: '#475569', fontSize: 13 }}>{cmp.category}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#14532D' }}>₹{cmp.budget.toLocaleString()}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#047857' }}>{cmp.totalOrders} orders</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          style={{
                            backgroundColor: cmp.status === 'LIVE' ? '#D1FAE5' : '#F3F4F6',
                            color: cmp.status === 'LIVE' ? '#047857' : '#6B7280',
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 20,
                          }}
                        >
                          {cmp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
           {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
