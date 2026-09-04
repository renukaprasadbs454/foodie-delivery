'use client';

import React, { useState } from 'react';
import { Text } from 'foodie-shared-web';

export interface EnquiryRecord {
  id: string;
  category: 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY' | 'GENERAL';
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  subject: string;
  message: string;
  timestamp: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  replyMessage?: string;
  resolvedAt?: string;
}

const INITIAL_ENQUIRIES: EnquiryRecord[] = [
  {
    id: 'ENQ-901',
    category: 'CUSTOMER',
    senderName: 'Ananya Sharma',
    senderEmail: 'ananya.s@gmail.com',
    senderPhone: '+91 98765 12345',
    subject: 'Delayed Refund for Order #ORD-9821',
    message: 'I was debited ₹450 for a cancelled order yesterday but haven\'t received refund in my bank account.',
    timestamp: '15 mins ago',
    status: 'OPEN',
  },
  {
    id: 'ENQ-902',
    category: 'CUSTOMER',
    senderName: 'Vikram Mehta',
    senderEmail: 'vikram.m@yahoo.com',
    senderPhone: '+91 98123 45678',
    subject: 'Unable to apply promo code WELCOME100',
    message: 'The promo code states invalid even though I am placing my first order.',
    timestamp: '40 mins ago',
    status: 'IN_PROGRESS',
    replyMessage: 'Our tech team is validating your first order eligibility status.',
  },
  {
    id: 'ENQ-903',
    category: 'RESTAURANT',
    senderName: 'Rajesh Gupta (Royal Biryani)',
    senderEmail: 'contact@royalbiryani.in',
    senderPhone: '+91 99001 88776',
    subject: 'Request to update menu prices & commission statement',
    message: 'We have updated our GST details and require our weekly commission payout report.',
    timestamp: '1 hour ago',
    status: 'OPEN',
  },
  {
    id: 'ENQ-904',
    category: 'DELIVERY',
    senderName: 'Ramesh Kumar (Rider #DRV-402)',
    senderEmail: 'ramesh.rider@gmail.com',
    senderPhone: '+91 97400 33211',
    subject: 'Rain Surge Payout Incentive Not Credited',
    message: 'I completed 12 orders during rain surge hours in Indiranagar yesterday. Rain bonus ₹300 is missing.',
    timestamp: '2 hours ago',
    status: 'OPEN',
  },
  {
    id: 'ENQ-905',
    category: 'GENERAL',
    senderName: 'Sanjay Kapoor (TechCrunch)',
    senderEmail: 'sanjay@techcrunch.com',
    senderPhone: '+91 98222 11000',
    subject: 'Media & Franchise Partnership Inquiry',
    message: 'Interested in featuring Foodie Hyperlocal Platform in our upcoming startup ecosystem report.',
    timestamp: '3 hours ago',
    status: 'OPEN',
  },
];

const INITIAL_HISTORY: EnquiryRecord[] = [
  {
    id: 'ENQ-880',
    category: 'CUSTOMER',
    senderName: 'Priya Nair',
    senderEmail: 'priya.nair@outlook.com',
    senderPhone: '+91 96555 44332',
    subject: 'Address change for live order',
    message: 'Please change delivery address from Flat 201 to Flat 405.',
    timestamp: '1 day ago',
    status: 'RESOLVED',
    replyMessage: 'Address updated and driver notified successfully via dispatch desk.',
    resolvedAt: '1 day ago by Admin',
  },
  {
    id: 'ENQ-881',
    category: 'RESTAURANT',
    senderName: 'Chef Marco (Bella Italia)',
    senderEmail: 'info@bellaitalia.com',
    senderPhone: '+91 98888 12121',
    subject: 'POS Integration API Credentials Request',
    message: 'We require sandbox API keys to integrate our kitchen POS with Foodie Merchant SDK.',
    timestamp: '2 days ago',
    status: 'RESOLVED',
    replyMessage: 'API Credentials and Sandbox documentation dispatched to vendor email.',
    resolvedAt: '2 days ago by Tech Desk',
  },
];

type ContactTab = 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY' | 'GENERAL' | 'HISTORY';

export function ContactUsPage() {
  const [activeTab, setActiveTab] = useState<ContactTab>('CUSTOMER');
  const [enquiries, setEnquiries] = useState<EnquiryRecord[]>(INITIAL_ENQUIRIES);
  const [history, setHistory] = useState<EnquiryRecord[]>(INITIAL_HISTORY);

  // Reply Modal State
  const [selectedEnquiry, setSelectedEnquiry] = useState<EnquiryRecord | null>(null);
  const [replyText, setReplyText] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleMarkAsResolved = (enquiryId: string) => {
    const target = enquiries.find((item) => item.id === enquiryId);
    if (!target) return;

    const resolvedRecord: EnquiryRecord = {
      ...target,
      status: 'RESOLVED',
      resolvedAt: 'Just now by Admin',
      replyMessage: target.replyMessage || 'Issue investigated and marked as resolved by Operations team.',
    };

    setEnquiries((prev) => prev.filter((item) => item.id !== enquiryId));
    setHistory((prev) => [resolvedRecord, ...prev]);

    setToastMsg(`Enquiry ${enquiryId} marked as RESOLVED!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnquiry || !replyText.trim()) {
      alert('Please enter your response message.');
      return;
    }

    setEnquiries((prev) =>
      prev.map((item) =>
        item.id === selectedEnquiry.id
          ? { ...item, replyMessage: replyText.trim(), status: 'IN_PROGRESS' }
          : item
      )
    );

    setToastMsg(`Response dispatched to ${selectedEnquiry.senderEmail}!`);
    setSelectedEnquiry(null);
    setReplyText('');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const getFilteredEnquiries = (cat: 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY' | 'GENERAL') => {
    return enquiries.filter((item) => item.category === cat);
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
            Contact Us & Support Operations Desk
          </Text>
          <Text as="p" variant="caption" color="#64748B">
            Manage customer, restaurant, delivery partner & general enquiries with direct message replies and resolution tracking
          </Text>
        </div>
      </div>

      {/* Navigation Tabs */}
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
          { id: 'CUSTOMER', label: 'Customer Enquiries', count: getFilteredEnquiries('CUSTOMER').length },
          { id: 'RESTAURANT', label: 'Restaurant Enquiries', count: getFilteredEnquiries('RESTAURANT').length },
          { id: 'DELIVERY', label: 'Delivery Partner Enquiries', count: getFilteredEnquiries('DELIVERY').length },
          { id: 'GENERAL', label: 'General Enquiries', count: getFilteredEnquiries('GENERAL').length },
          { id: 'HISTORY', label: 'Contact History', count: history.length },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as ContactTab)}
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
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  backgroundColor: isActive ? '#F59E0B' : '#E2E8F0',
                  color: isActive ? '#14532D' : '#475569',
                  padding: '2px 8px',
                  borderRadius: 10,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Enquiries List */}
      {activeTab !== 'HISTORY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {getFilteredEnquiries(activeTab as any).length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', padding: 40, borderRadius: 14, textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
              No open enquiries in this category! All tickets resolved.
            </div>
          ) : (
            getFilteredEnquiries(activeTab as any).map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 14,
                  border: '1px solid #E2E8F0',
                  borderLeft: item.status === 'IN_PROGRESS' ? '5px solid #F59E0B' : '5px solid #10B981',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16, fontWeight: 800, color: '#14532D' }}>{item.subject}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          backgroundColor: item.status === 'IN_PROGRESS' ? '#FEF3C7' : '#D1FAE5',
                          color: item.status === 'IN_PROGRESS' ? '#B45309' : '#047857',
                          padding: '3px 8px',
                          borderRadius: 4,
                        }}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                      From: <strong>{item.senderName}</strong> ({item.senderEmail} • {item.senderPhone}) | Recd: {item.timestamp}
                    </div>
                  </div>

                  {/* Actions: Message Reply & Mark as Resolved */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEnquiry(item);
                        setReplyText(item.replyMessage || '');
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#FEF3C7',
                        color: '#B45309',
                        border: '1px solid #FCD34D',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      Message Reply
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMarkAsResolved(item.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#14532D',
                        color: '#F59E0B',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      Mark as Resolved
                    </button>
                  </div>
                </div>

                {/* Enquiry Body */}
                <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                  "{item.message}"
                </div>

                {/* Existing Reply Draft */}
                {item.replyMessage && (
                  <div style={{ backgroundColor: '#ECFDF5', padding: 12, borderRadius: 8, border: '1px solid #A7F3D0', fontSize: 12, color: '#065F46' }}>
                    <strong>Dispatch Draft Sent:</strong> {item.replyMessage}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 5: CONTACT HISTORY */}
      {activeTab === 'HISTORY' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>Resolved Contact History Audit Log</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E2E8F0', color: '#64748B', backgroundColor: '#F8FAFC' }}>
                <th style={{ padding: '14px 20px' }}>Enquiry & Sender</th>
                <th style={{ padding: '14px 20px' }}>Category</th>
                <th style={{ padding: '14px 20px' }}>Original Request</th>
                <th style={{ padding: '14px 20px' }}>Admin Response Sent</th>
                <th style={{ padding: '14px 20px' }}>Resolution Audit</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 800, color: '#14532D' }}>{row.senderName}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{row.senderEmail}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: 4 }}>
                      {row.category}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', maxWidth: 220 }}>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 12 }}>{row.subject}</div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.message}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', maxWidth: 240 }}>
                    <div style={{ fontSize: 12, color: '#047857', fontWeight: 600 }}>{row.replyMessage || 'Resolved via phone call'}</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: 11, color: '#64748B' }}>{row.resolvedAt || 'Resolved'}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ backgroundColor: '#D1FAE5', color: '#047857', fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 20 }}>
                      RESOLVED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MESSAGE REPLY MODAL */}
      {selectedEnquiry && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setSelectedEnquiry(null)}
        >
          <form
            onSubmit={handleSendReply}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 540,
              width: '100%',
              padding: 28,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
                Reply to {selectedEnquiry.senderName}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B' }}
              >
                
              </button>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, fontSize: 12, color: '#475569' }}>
              <strong>Subject:</strong> {selectedEnquiry.subject}<br />
              <strong>Recipient Email:</strong> {selectedEnquiry.senderEmail}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D', display: 'block', marginBottom: 6 }}>
                Compose Response Message *
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={5}
                placeholder="Type your official reply message to be dispatched via email and SMS notification..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, resize: 'vertical' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setSelectedEnquiry(null)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#F1F5F9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#14532D',
                  color: '#F59E0B',
                  border: 'none',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Dispatch Response Now
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
