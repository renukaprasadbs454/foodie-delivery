'use client';

import React, { useState } from 'react';
import { Text } from 'foodie-shared-web';

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  audience: 'ALL' | 'CUSTOMERS' | 'RESTAURANTS' | 'DELIVERY_PARTNERS';
  sentTime: string;
  recipientsCount: number;
  deliveryRate: string;
  openRate: string;
  status: 'DELIVERED' | 'SCHEDULED' | 'FAILED';
}

const MOCK_NOTIFICATIONS_HISTORY: NotificationRecord[] = [
  {
    id: 'notif-101',
    title: 'Welcome Bonus Voucher Credited!',
    body: 'Flat ₹100 discount applied on your first order with code WELCOME100.',
    audience: 'CUSTOMERS',
    sentTime: '10 mins ago',
    recipientsCount: 14800,
    deliveryRate: '99.4%',
    openRate: '42.8%',
    status: 'DELIVERED',
  },
  {
    id: 'notif-102',
    title: 'Peak Rain Surge Bonus ACTIVE (+₹25)',
    body: 'Earn ₹25 additional payout per completed delivery in Indiranagar zone.',
    audience: 'DELIVERY_PARTNERS',
    sentTime: '25 mins ago',
    recipientsCount: 450,
    deliveryRate: '98.8%',
    openRate: '88.2%',
    status: 'DELIVERED',
  },
  {
    id: 'notif-103',
    title: 'Diwali Feast & Culinary Gala 2025',
    body: 'Join platform campaign and boost your store visibility by up to 60%.',
    audience: 'RESTAURANTS',
    sentTime: '2 hours ago',
    recipientsCount: 180,
    deliveryRate: '100%',
    openRate: '76.4%',
    status: 'DELIVERED',
  },
  {
    id: 'notif-104',
    title: 'Monsoon Hot Chai & Bakery Bonanza',
    body: 'Get Flat 30% OFF on all bakery & cafes near you!',
    audience: 'ALL',
    sentTime: '1 day ago',
    recipientsCount: 22500,
    deliveryRate: '99.1%',
    openRate: '38.5%',
    status: 'DELIVERED',
  },
];

type NotificationTab = 'SEND' | 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY' | 'HISTORY';

export function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationTab>('SEND');

  // Form State for Send Notifications
  const [audience, setAudience] = useState<'ALL' | 'CUSTOMERS' | 'RESTAURANTS' | 'DELIVERY_PARTNERS'>('ALL');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [deeplink, setDeeplink] = useState('/coupons');
  const [scheduledTime, setScheduledTime] = useState('IMMEDIATE');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [history, setHistory] = useState<NotificationRecord[]>(MOCK_NOTIFICATIONS_HISTORY);

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert('Please enter Notification Title and Message Content');
      return;
    }

    const newRecord: NotificationRecord = {
      id: `notif-${Date.now().toString().slice(-4)}`,
      title: title.trim(),
      body: body.trim(),
      audience,
      sentTime: 'Just now',
      recipientsCount: audience === 'ALL' ? 25000 : audience === 'CUSTOMERS' ? 18000 : audience === 'RESTAURANTS' ? 350 : 650,
      deliveryRate: '99.5%',
      openRate: '0.0%',
      status: 'DELIVERED',
    };

    setHistory((prev) => [newRecord, ...prev]);
    setTitle('');
    setBody('');
    setToastMsg(`Broadcast notification "${newRecord.title}" sent to ${audience}!`);
    setTimeout(() => setToastMsg(null), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            backgroundColor: '#14532D',
            color: '#F59E0B',
            padding: '12px 24px',
            borderRadius: 10,
            fontWeight: 800,
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 9999,
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Text as="h1" variant="heading1" color="#14532D">
            Platform Notifications Center
          </Text>
          <Text as="p" variant="caption" color="#64748B">
            Send push notifications, monitor customer & store alerts, dispatch delivery driver updates & review history
          </Text>
        </div>
      </div>

      {/* 5 Outer Visible Navigation Tabs */}
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
          { id: 'SEND', label: 'Send Notifications' },
          { id: 'CUSTOMER', label: 'Customer Notifications' },
          { id: 'RESTAURANT', label: 'Restaurant Notifications' },
          { id: 'DELIVERY', label: 'Delivery Partner Notifications' },
          { id: 'HISTORY', label: 'Notification History' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as NotificationTab)}
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

      {/* TAB 1: SEND NOTIFICATIONS */}
      {activeTab === 'SEND' && (
        <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: 24 }}>
          {/* Compose Form */}
          <form
            onSubmit={handleSendNotification}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid #E2E8F0',
              borderTop: '4px solid #14532D',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
              Compose Broadcast Push Notification
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Target Audience *</label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as any)}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
              >
                <option value="ALL">All Platform Users (Broadcast)</option>
                <option value="CUSTOMERS">Customer Apps Only</option>
                <option value="RESTAURANTS">Restaurant Partner Dashboards</option>
                <option value="DELIVERY_PARTNERS">Delivery Driver Fleet</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Notification Title *</label>
              <input
                type="text"
                placeholder="e.g. 50% OFF Weekend Super Deal!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Message Content *</label>
              <textarea
                placeholder="e.g. Order now from top rated pizzerias & get instant cashback in your wallet."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none', resize: 'vertical' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Action URL / Deep Link</label>
                <input
                  type="text"
                  placeholder="e.g. /coupons"
                  value={deeplink}
                  onChange={(e) => setDeeplink(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Schedule Time</label>
                <select
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                >
                  <option value="IMMEDIATE">Send Immediately</option>
                  <option value="IN_1_HOUR">In 1 Hour</option>
                  <option value="TONIGHT_8PM">Tonight at 8:00 PM</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              style={{
                padding: '12px 20px',
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
              Send Broadcast Notification Now
            </button>
          </form>

          {/* Live Mobile & Desktop Preview Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#14532D', margin: 0 }}>
              Live User Notification Preview
            </h3>

            {/* Mobile Push Notification Mock Bubble */}
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: 16, border: '1px solid #CBD5E1', padding: '16px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: 420 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#14532D' }}>FOODIE MARKETPLACE</span>
                </div>
                <span style={{ fontSize: 11, color: '#64748B' }}>now</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                {title || 'Your Push Notification Title'}
              </div>
              <div style={{ fontSize: 13, color: '#334155', marginTop: 4, lineHeight: 1.4 }}>
                {body || 'Notification message content preview will appear here on customer mobile devices.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER NOTIFICATIONS */}
      {activeTab === 'CUSTOMER' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>Customer Push Broadcast Alerts</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {[
              { title: 'Welcome Bonus Voucher Credited!', time: '10 mins ago', desc: 'Flat ₹100 discount applied on your first order with code WELCOME100.', stats: '14,800 sent • 99.4% delivered' },
              { title: 'Order #ORD-9821 Out For Delivery', time: '30 mins ago', desc: 'Ramesh Kumar has picked up your order from Royal Biryani House.', stats: 'Personalized Alert' },
              { title: 'Monsoon Flash Sale LIVE', time: '2 hours ago', desc: 'Get Flat 30% OFF on all hot beverages & bakeries.', stats: '22,500 sent • 38.5% opened' },
            ].map((card, idx) => (
              <div key={idx} style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#14532D' }}>{card.title}</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 1.4 }}>{card.desc}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', marginTop: 8 }}>{card.stats}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RESTAURANT NOTIFICATIONS */}
      {activeTab === 'RESTAURANT' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>Restaurant Partner Portal Alerts</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {[
              { title: 'New Express Order #ORD-9824', time: '5 mins ago', desc: 'Punjab Grill received a new order for 2x Paneer Tikka.', stats: 'Instant Portal Sound Alert' },
              { title: 'Weekly Payout Deposited', time: '1 day ago', desc: '₹48,250 net earnings transferred to HDFC Bank A/C ****9812.', stats: '350 merchants notified' },
              { title: 'FSSAI License Renewal Alert', time: '2 days ago', desc: 'Please update your FSSAI food safety certificate before expiry.', stats: 'Compliance Alert' },
            ].map((card, idx) => (
              <div key={idx} style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#14532D' }}>{card.title}</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 1.4 }}>{card.desc}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', marginTop: 8 }}>{card.stats}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DELIVERY PARTNER NOTIFICATIONS */}
      {activeTab === 'DELIVERY' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>Delivery Fleet Dispatch Alerts</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {[
              { title: 'Rain Surge Bonus ACTIVE (+₹25)', time: '15 mins ago', desc: 'Earn ₹25 extra per delivery in Indiranagar & Koramangala zones.', stats: '450 drivers active' },
              { title: 'New Delivery Assignment Nearby', time: '45 mins ago', desc: 'Pickup assigned at Bella Italia Pizzeria (1.2 km away).', stats: 'Driver App Push' },
              { title: 'Document Verification Complete', time: '1 day ago', desc: 'Driving License DL-9823 verified by Admin console.', stats: 'KYC Confirmation' },
            ].map((card, idx) => (
              <div key={idx} style={{ backgroundColor: '#F8FAFC', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#14532D' }}>{card.title}</div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 4, lineHeight: 1.4 }}>{card.desc}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#D97706', marginTop: 8 }}>{card.stats}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: NOTIFICATION HISTORY */}
      {activeTab === 'HISTORY' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>Notification Dispatch History Logs</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', backgroundColor: '#F8FAFC' }}>
                <th style={{ padding: '14px 20px' }}>Title & Message</th>
                <th style={{ padding: '14px 20px' }}>Target Audience</th>
                <th style={{ padding: '14px 20px' }}>Sent Time</th>
                <th style={{ padding: '14px 20px' }}>Recipients</th>
                <th style={{ padding: '14px 20px' }}>Delivery Rate</th>
                <th style={{ padding: '14px 20px' }}>Open Rate</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 800, color: '#14532D' }}>{row.title}</div>
                    <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{row.body}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: 4 }}>
                      {row.audience}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#64748B', fontSize: 12 }}>{row.sentTime}</td>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#0F172A' }}>{row.recipientsCount.toLocaleString()}</td>
                  <td style={{ padding: '16px 20px', color: '#047857', fontWeight: 700 }}>{row.deliveryRate}</td>
                  <td style={{ padding: '16px 20px', color: '#D97706', fontWeight: 700 }}>{row.openRate}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ backgroundColor: '#D1FAE5', color: '#047857', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
