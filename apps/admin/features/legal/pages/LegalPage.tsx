'use client';

import React, { useState } from 'react';
import { Text } from 'foodie-shared-web';

type LegalTab = 'TERMS' | 'PRIVACY' | 'REFUND' | 'DELIVERY' | 'COOKIE';

export function LegalPage() {
  const [activeTab, setActiveTab] = useState<LegalTab>('TERMS');

  // Cookie settings state
  const [essentialCookies] = useState(true);
  const [analyticsCookies, setAnalyticsCookies] = useState(true);
  const [marketingCookies, setMarketingCookies] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Text as="h1" variant="heading1" color="#14532D">
            Legal & Compliance Governance Center
          </Text>
          <Text as="p" variant="caption" color="#64748B">
            Platform terms, privacy compliance, refund rules, delivery standards & cookie consent policies
          </Text>
        </div>
      </div>

      {/* 5 Navigation Tabs */}
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
        {[
          { id: 'TERMS', label: 'Terms & Conditions' },
          { id: 'PRIVACY', label: 'Privacy Policy' },
          { id: 'REFUND', label: 'Refund & Cancellation Policy' },
          { id: 'DELIVERY', label: 'Delivery Policy' },
          { id: 'COOKIE', label: 'Cookie Policy' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as LegalTab)}
              style={{
                padding: '12px 20px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: isActive ? '#14532D' : 'transparent',
                color: isActive ? '#F59E0B' : '#475569',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TERMS & CONDITIONS */}
      {activeTab === 'TERMS' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
            Master Platform Terms & Conditions
          </h2>
          <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>1. Platform Operational Framework</h3>
              <div>
                Foodie Hyperlocal operates as an intermediary marketplace connecting customers, multi-vendor food merchants, cloud kitchens, and independent delivery partners. All users agree to adhere to platform code of conduct.
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>2. Merchant Agreement & Hygiene Compliance</h3>
              <div>
                Restaurants and food partners agree to maintain active FSSAI licenses, update real-time item availability, and ensure food preparation adheres to strict health & safety standards.
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>3. Delivery Partner Conduct & Payout Rights</h3>
              <div>
                Delivery partners function as independent gig dispatchers entitled to transparent per-kilometer and surge earnings. Zero-tolerance policy applies for order tampering or unverified KYC profiles.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRIVACY POLICY */}
      {activeTab === 'PRIVACY' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
            Data Protection & Privacy Policy Guidelines
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#14532D' }}>256-Bit SSL Encryption</div>
              <div style={{ fontSize: 13, color: '#334155' }}>
                All mobile app & web traffic is encrypted using TLS 1.3 protocol. User credentials and transaction logs are stored in encrypted database clusters.
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#14532D' }}>Driver KYC Confidentiality</div>
              <div style={{ fontSize: 13, color: '#334155' }}>
                Delivery partner Aadhaar, Driving License, and vehicle Registration documents are stored in secure AWS S3 buckets accessible only via short-lived signed URLs.
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#14532D' }}>PCI-DSS Payment Standards</div>
              <div style={{ fontSize: 13, color: '#334155' }}>
                Credit/Debit card details and UPI payment hashes are processed via PCI-DSS Level 1 certified gateways (Razorpay, Stripe, Paytm).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REFUND & CANCELLATION POLICY */}
      {activeTab === 'REFUND' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
            Customer Refund & Order Cancellation Policy
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ backgroundColor: '#ECFDF5', padding: 18, borderRadius: 10, border: '1px solid #A7F3D0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <strong style={{ color: '#065F46' }}>Instant Wallet Refunds</strong>
              <div style={{ fontSize: 13, color: '#065F46' }}>
                Cancellation refunds requested before kitchen food preparation starts are credited to Foodie Pay Wallet within 60 seconds.
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <strong style={{ color: '#0F172A' }}>Post-Preparation Cancellations</strong>
              <div style={{ fontSize: 13, color: '#334155' }}>
                Cancellation requests after food preparation has commenced incur a nominal 50% kitchen compensation charge.
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <strong style={{ color: '#0F172A' }}>Missing or Damaged Items</strong>
              <div style={{ fontSize: 13, color: '#334155' }}>
                Customers reporting missing items with photo proof receive pro-rata partial refunds or instant replacement vouchers.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DELIVERY POLICY */}
      {activeTab === 'DELIVERY' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
            Hyperlocal Delivery Policy & Dispatch SLAs
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 800, color: '#14532D', fontSize: 14 }}>Service Radius Limits</div>
              <div style={{ fontSize: 13, color: '#334155' }}>
                Standard delivery radius is capped at 12 km from restaurant location to ensure food fresh-temperature standards.
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 800, color: '#14532D', fontSize: 14 }}>On-Time SLA Guarantee</div>
              <div style={{ fontSize: 13, color: '#334155' }}>
                Target delivery time is calculated dynamically based on Google Maps traffic API + 15 min kitchen preparation buffer.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: COOKIE POLICY */}
      {activeTab === 'COOKIE' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
            Cookie Consent & Tracking Preferences
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, backgroundColor: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>Essential System Cookies</div>
                <input type="checkbox" checked={essentialCookies} disabled style={{ width: 18, height: 18 }} />
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Required for user authentication, session security, and cart persistence.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, backgroundColor: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>Analytics & Performance Cookies</div>
                <input type="checkbox" checked={analyticsCookies} onChange={(e) => setAnalyticsCookies(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Allows us to measure app performance, page load speed, and checkout bottlenecks.
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, backgroundColor: '#F8FAFC', padding: 18, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: 14 }}>Marketing & Promotional Cookies</div>
                <input type="checkbox" checked={marketingCookies} onChange={(e) => setMarketingCookies(e.target.checked)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              </div>
              <div style={{ fontSize: 12, color: '#64748B' }}>
                Used for personalized coupon recommendations and discount push messages.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
