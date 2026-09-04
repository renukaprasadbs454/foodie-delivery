'use client';

import React, { useEffect, useState } from 'react';
import { Text, trackAnalyticsEvent, useTheme } from 'foodie-shared-web';
import { GAP_API_20_GLOBAL_REVIEWS } from '@/constants/gaps';
import { useAppSelector } from '@/store/hooks';
import { selectActiveModule } from '@/store/moduleSlice';

export interface CustomerReviewRecord {
  id: string;
  customerName: string;
  restaurantName: string;
  deliveryManName: string;
  module: string;
  rating: number;
  deliveryRating: number;
  comment: string;
  createdAt: string;
  status: 'PUBLISHED' | 'FLAGGED' | 'HIDDEN';
  isReported: boolean;
}

export interface SupportTicketRecord {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  category: 'RESTAURANT_ISSUE' | 'DELIVERY_ISSUE' | 'REFUND_REQUEST' | 'GENERAL_SUPPORT';
  issueTitle: string;
  details: string;
  assignedAgent: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  refundAmount?: number;
}

const MOCK_REVIEWS: CustomerReviewRecord[] = [
  {
    id: 'rev-101',
    customerName: 'Siddharth V.',
    restaurantName: 'Royal Biryani House',
    deliveryManName: 'Ramesh Kumar',
    module: 'North Indian & Biryani',
    rating: 5,
    deliveryRating: 5,
    comment: 'Exceptional aromatic biryani! Arrived piping hot in pristine packaging.',
    createdAt: '10 mins ago',
    status: 'PUBLISHED',
    isReported: false,
  },
  {
    id: 'rev-102',
    customerName: 'Meera Kapoor',
    restaurantName: 'Bella Italia Pizzeria',
    deliveryManName: 'Vikram Singh',
    module: 'Italian & Pizza',
    rating: 5,
    deliveryRating: 5,
    comment: 'Crispy wood-fired crust with rich melted mozzarella! Delivered in under 20 mins.',
    createdAt: '35 mins ago',
    status: 'PUBLISHED',
    isReported: false,
  },
  {
    id: 'rev-103',
    customerName: 'Rahul Sharma',
    restaurantName: 'Sweet Dreams Bakery',
    deliveryManName: 'Suresh Raina',
    module: 'Desserts & Bakery',
    rating: 4,
    deliveryRating: 4,
    comment: 'Delicious chocolate lava cake! Super rich and moist.',
    createdAt: '1 hour ago',
    status: 'PUBLISHED',
    isReported: false,
  },
  {
    id: 'rev-104',
    customerName: 'Pooja Nair',
    restaurantName: 'Dragon Bowl Asian Kitchen',
    deliveryManName: 'Anil Yadav',
    module: 'Pan-Asian',
    rating: 2,
    deliveryRating: 3,
    comment: 'Noodles were cold and container lid was cracked on arrival.',
    createdAt: '2 hours ago',
    status: 'FLAGGED',
    isReported: true,
  },
];

const MOCK_TICKETS: SupportTicketRecord[] = [
  {
    id: 'tck-101',
    ticketNumber: 'TCK-8901',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98765 00005',
    category: 'RESTAURANT_ISSUE',
    issueTitle: 'Missing Extra Butter Naan & Spilled Curry',
    details: 'Ordered Paneer Tikka Thali. 2x Naan missing and packaging leaked into brown bag.',
    assignedAgent: 'Preethi Shree D (Admin)',
    priority: 'HIGH',
    status: 'OPEN',
    createdAt: '15 mins ago',
    refundAmount: 180,
  },
  {
    id: 'tck-102',
    ticketNumber: 'TCK-8902',
    customerName: 'Rohan Gupta',
    customerPhone: '+91 98123 44556',
    category: 'DELIVERY_ISSUE',
    issueTitle: 'Delivery Partner Delayed by 45 Minutes',
    details: 'Driver took wrong route and delivered cold food 45 mins after scheduled ETA.',
    assignedAgent: 'Rajesh Kumar (Ops)',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    createdAt: '40 mins ago',
    refundAmount: 120,
  },
  {
    id: 'tck-103',
    ticketNumber: 'TCK-8903',
    customerName: 'Kavita Sundaram',
    customerPhone: '+91 97788 11223',
    category: 'REFUND_REQUEST',
    issueTitle: 'Full Order Cancellation Refund Claim',
    details: 'Order canceled due to store outage. Customer requesting ₹450 Razorpay refund.',
    assignedAgent: 'Ananya Varma (Finance)',
    priority: 'MEDIUM',
    status: 'RESOLVED',
    createdAt: '2 hours ago',
    refundAmount: 450,
  },
];

type MainTab = 'REVIEWS_RATINGS' | 'CUSTOMER_COMPLAINTS';
type ReviewSubTab = 'ALL' | 'RESTAURANT_RATINGS' | 'DELIVERY_RATINGS' | 'REPORTED_REVIEWS' | 'MODERATION';
type TicketSubTab = 'ALL' | 'RESTAURANT_ISSUES' | 'DELIVERY_ISSUES' | 'REFUND_REQUESTS' | 'SUPPORT_TICKETS';

export function ReviewsPage() {
  const { tokens } = useTheme();
  const activeModule = useAppSelector(selectActiveModule);

  const [mainTab, setMainTab] = useState<MainTab>('REVIEWS_RATINGS');
  const [reviewSubTab, setReviewSubTab] = useState<ReviewSubTab>('ALL');
  const [ticketSubTab, setTicketSubTab] = useState<TicketSubTab>('ALL');
  const [ticketStatusFilter, setTicketStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('ALL');

  const [reviews, setReviews] = useState<CustomerReviewRecord[]>(MOCK_REVIEWS);
  const [tickets, setTickets] = useState<SupportTicketRecord[]>(MOCK_TICKETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    trackAnalyticsEvent('admin_reviews_viewed', {
      gapId: GAP_API_20_GLOBAL_REVIEWS,
    });
  }, []);

  const handleModeration = (id: string, newStatus: 'PUBLISHED' | 'HIDDEN' | 'FLAGGED') => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
    );
    setToastMsg(`Review status updated to ${newStatus}`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleTicketStatusChange = (id: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)),
    );
    setToastMsg(`Ticket ${id} status set to ${newStatus}`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      searchQuery === '' ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase());

    if (reviewSubTab === 'REPORTED_REVIEWS') return r.isReported && matchesSearch;
    if (reviewSubTab === 'MODERATION') return r.status === 'FLAGGED' && matchesSearch;
    return matchesSearch;
  });

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = ticketStatusFilter === 'ALL' || t.status === ticketStatusFilter;
    const matchesSearch =
      searchQuery === '' ||
      t.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.issueTitle.toLowerCase().includes(searchQuery.toLowerCase());

    if (ticketSubTab === 'RESTAURANT_ISSUES') return t.category === 'RESTAURANT_ISSUE' && matchesStatus && matchesSearch;
    if (ticketSubTab === 'DELIVERY_ISSUES') return t.category === 'DELIVERY_ISSUE' && matchesStatus && matchesSearch;
    if (ticketSubTab === 'REFUND_REQUESTS') return t.category === 'REFUND_REQUEST' && matchesStatus && matchesSearch;
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Text as="h1" variant="heading1" color="#14532D">
            Reviews & Customer Complaints Desk
          </Text>
          <Text as="p" variant="caption" color="#64748B">
            Manage customer ratings, restaurant feedback, delivery partner scorecards, reported reviews & support complaints
          </Text>
        </div>
      </div>

      {/* Main Mode Navigation (Reviews & Ratings vs Customer Complaints) */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          backgroundColor: '#FFFFFF',
          padding: '8px',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
        }}
      >
        <button
          type="button"
          onClick={() => setMainTab('REVIEWS_RATINGS')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: mainTab === 'REVIEWS_RATINGS' ? '#14532D' : 'transparent',
            color: mainTab === 'REVIEWS_RATINGS' ? '#F59E0B' : '#475569',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Reviews & Ratings ({reviews.length})
        </button>

        <button
          type="button"
          onClick={() => setMainTab('CUSTOMER_COMPLAINTS')}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: 8,
            border: 'none',
            backgroundColor: mainTab === 'CUSTOMER_COMPLAINTS' ? '#14532D' : 'transparent',
            color: mainTab === 'CUSTOMER_COMPLAINTS' ? '#F59E0B' : '#475569',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          Customer Complaints & Tickets ({tickets.length})
        </button>
      </div>

      {/* SECTION 1: REVIEWS & RATINGS */}
      {mainTab === 'REVIEWS_RATINGS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Sub Feature Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'Customer Reviews' },
              { id: 'RESTAURANT_RATINGS', label: 'Restaurant Ratings (4.8)' },
              { id: 'DELIVERY_RATINGS', label: 'Delivery Partner Ratings (4.9)' },
              { id: 'REPORTED_REVIEWS', label: 'Reported Reviews' },
              { id: 'MODERATION', label: 'Review Moderation' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReviewSubTab(tab.id as ReviewSubTab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: reviewSubTab === tab.id ? '#14532D' : '#FFFFFF',
                  color: reviewSubTab === tab.id ? '#F59E0B' : '#475569',
                  fontSize: 13,
                  fontWeight: reviewSubTab === tab.id ? 800 : 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Restaurant Ratings Feature Overview Card */}
          {reviewSubTab === 'RESTAURANT_RATINGS' && (
            <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Top Rated Restaurant</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#14532D' }}>Royal Biryani House (4.9 )</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Total 5-Star Outlets</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#047857' }}>148 Restaurants</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Low Rating Warnings (&lt;3.5)</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#DC2626' }}>2 Outlets Under Review</div>
              </div>
            </div>
          )}

          {/* Delivery Partner Ratings Feature Overview Card */}
          {reviewSubTab === 'DELIVERY_RATINGS' && (
            <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Fleet Dispatch Average</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#14532D' }}>4.92  (On-Time 98.4%)</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Top Delivery Partner</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#047857' }}>Ramesh Kumar (5.0  - 420 deliveries)</div>
              </div>
            </div>
          )}

          {/* Reviews Directory Table */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#14532D', fontWeight: 700 }}>
                  <th style={{ padding: '14px 20px' }}>Customer & Store</th>
                  <th style={{ padding: '14px 20px' }}>Ratings</th>
                  <th style={{ padding: '14px 20px' }}>Feedback Comment</th>
                  <th style={{ padding: '14px 20px' }}>Delivery Partner</th>
                  <th style={{ padding: '14px 20px' }}>Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Review Moderation</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 700, color: '#14532D' }}>{r.customerName}</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>{r.restaurantName} • <span style={{ color: '#D97706', fontWeight: 600 }}>{r.module}</span></div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 800, color: '#D97706' }}>Store: {r.rating} </div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>Delivery: {r.deliveryRating} </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#334155', maxWidth: 360, lineHeight: 1.4 }}>
                      &ldquo;{r.comment}&rdquo;
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                       {r.deliveryManName}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ backgroundColor: r.status === 'PUBLISHED' ? '#D1FAE5' : r.status === 'FLAGGED' ? '#FEF3C7' : '#FEE2E2', color: r.status === 'PUBLISHED' ? '#047857' : r.status === 'FLAGGED' ? '#B45309' : '#B91C1C', fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 20 }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        {r.status !== 'PUBLISHED' && (
                          <button type="button" onClick={() => handleModeration(r.id, 'PUBLISHED')} style={{ padding: '5px 10px', backgroundColor: '#D1FAE5', color: '#047857', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Approve
                          </button>
                        )}
                        {r.status !== 'HIDDEN' && (
                          <button type="button" onClick={() => handleModeration(r.id, 'HIDDEN')} style={{ padding: '5px 10px', backgroundColor: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Hide
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: CUSTOMER COMPLAINTS & TICKETS */}
      {mainTab === 'CUSTOMER_COMPLAINTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Sub Feature Tabs */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'Support Tickets' },
              { id: 'RESTAURANT_ISSUES', label: 'Restaurant Issues' },
              { id: 'DELIVERY_ISSUES', label: 'Delivery Issues' },
              { id: 'REFUND_REQUESTS', label: 'Refund Requests' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTicketSubTab(tab.id as TicketSubTab)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: ticketSubTab === tab.id ? '#FEF3C7' : '#FFFFFF',
                  color: ticketSubTab === tab.id ? '#14532D' : '#475569',
                  fontSize: 13,
                  fontWeight: ticketSubTab === tab.id ? 800 : 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Ticket Status Filter Bar */}
          <div style={{ display: 'flex', gap: 8, backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#14532D', alignSelf: 'center', marginRight: 8 }}>Ticket Status:</span>
            {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setTicketStatusFilter(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: ticketStatusFilter === st ? '#14532D' : '#F1F5F9',
                  color: ticketStatusFilter === st ? '#F59E0B' : '#475569',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Complaints Table */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#14532D', fontWeight: 700 }}>
                  <th style={{ padding: '14px 20px' }}>Ticket # & Customer</th>
                  <th style={{ padding: '14px 20px' }}>Category & Issue</th>
                  <th style={{ padding: '14px 20px' }}>Assigned Agent</th>
                  <th style={{ padding: '14px 20px' }}>Claim Amount</th>
                  <th style={{ padding: '14px 20px' }}>Ticket Status</th>
                  <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 800, color: '#14532D', fontFamily: 'monospace' }}> {t.ticketNumber}</div>
                      <div style={{ fontSize: 12, color: '#0F172A', fontWeight: 600 }}>{t.customerName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{t.customerPhone}</div>
                    </td>
                    <td style={{ padding: '16px 20px', maxWidth: 340 }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#B45309', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: 4, width: 'fit-content', marginBottom: 4 }}>
                        {t.category.replace(/_/g, ' ')}
                      </div>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13 }}>{t.issueTitle}</div>
                      <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>{t.details}</div>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: 13, color: '#334155', fontWeight: 600 }}>
                       {t.assignedAgent}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 800, color: '#D97706' }}>
                      {t.refundAmount ? `₹${t.refundAmount}` : 'N/A'}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span
                        style={{
                          backgroundColor: t.status === 'OPEN' ? '#FEE2E2' : t.status === 'IN_PROGRESS' ? '#FEF3C7' : '#D1FAE5',
                          color: t.status === 'OPEN' ? '#B91C1C' : t.status === 'IN_PROGRESS' ? '#B45309' : '#047857',
                          fontSize: 11,
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: 20,
                        }}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        {t.status !== 'RESOLVED' && (
                          <button
                            type="button"
                            onClick={() => handleTicketStatusChange(t.id, 'RESOLVED')}
                            style={{ padding: '6px 12px', backgroundColor: '#D1FAE5', color: '#047857', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Resolve
                          </button>
                        )}
                        {t.status !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={() => handleTicketStatusChange(t.id, 'CLOSED')}
                            style={{ padding: '6px 12px', backgroundColor: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                          >
                            Close
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toastMsg && (
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
      )}
    </div>
  );
}

