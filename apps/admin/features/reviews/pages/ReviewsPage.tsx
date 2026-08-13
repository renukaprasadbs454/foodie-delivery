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
  module: string;
  rating: number;
  deliveryRating: number;
  comment: string;
  createdAt: string;
  status: 'PUBLISHED' | 'FLAGGED' | 'HIDDEN';
}

const MOCK_REVIEWS: CustomerReviewRecord[] = [
  {
    id: 'rev-101',
    customerName: 'Siddharth V.',
    restaurantName: 'Royal Biryani House',
    module: 'North Indian & Biryani',
    rating: 5,
    deliveryRating: 5,
    comment: 'Exceptional aromatic biryani! Arrived piping hot in pristine packaging.',
    createdAt: '10 mins ago',
    status: 'PUBLISHED',
  },
  {
    id: 'rev-102',
    customerName: 'Meera Kapoor',
    restaurantName: 'Bella Italia Pizzeria',
    module: 'Italian & Pizza',
    rating: 5,
    deliveryRating: 5,
    comment: 'Crispy wood-fired crust with rich melted mozzarella! Delivered in under 20 mins.',
    createdAt: '35 mins ago',
    status: 'PUBLISHED',
  },
  {
    id: 'rev-103',
    customerName: 'Rahul Sharma',
    restaurantName: 'Sweet Dreams Bakery',
    module: 'Desserts & Bakery',
    rating: 4,
    deliveryRating: 4,
    comment: 'Delicious chocolate lava cake! Super rich and moist.',
    createdAt: '1 hour ago',
    status: 'PUBLISHED',
  },
  {
    id: 'rev-104',
    customerName: 'Pooja Nair',
    restaurantName: 'Dragon Bowl Asian Kitchen',
    module: 'Pan-Asian',
    rating: 2,
    deliveryRating: 3,
    comment: 'Noodles were slightly cold on arrival, but soup flavor was good.',
    createdAt: '2 hours ago',
    status: 'FLAGGED',
  },
];

export function ReviewsPage() {
  const { tokens } = useTheme();
  const activeModule = useAppSelector(selectActiveModule);
  const [reviews, setReviews] = useState<CustomerReviewRecord[]>(MOCK_REVIEWS);
  const [ratingFilter, setRatingFilter] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    trackAnalyticsEvent('admin_reviews_viewed', {
      gapId: GAP_API_20_GLOBAL_REVIEWS,
    });
  }, []);

  const filteredReviews = reviews.filter((r) => {
    const matchesRating = ratingFilter === 'ALL' || r.rating === ratingFilter;
    const matchesSearch =
      searchQuery === '' ||
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.comment.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesModule = true;
    if (activeModule === 'RESTAURANTS') {
      matchesModule = r.module.includes('Indian') || r.module.includes('Italian') || r.module.includes('Pizza');
    } else if (activeModule === 'CAFES') {
      matchesModule = r.module.includes('Bakery') || r.module.includes('Desserts') || r.module.includes('Cafe');
    } else if (activeModule === 'CLOUD_KITCHEN') {
      matchesModule = r.module.includes('Asian') || r.module.includes('Fast Food') || r.module.includes('Burgers');
    }

    return matchesRating && matchesSearch && matchesModule;
  });

  const handleModeration = (id: string, newStatus: 'PUBLISHED' | 'HIDDEN' | 'FLAGGED') => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
    );
    setToastMsg(`Review status updated to ${newStatus}`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Text as="h1" variant="heading1" color="#14532D">
            Customer Ratings & Reviews Moderation
          </Text>
          <Text as="p" variant="caption" color="#64748B">
            Monitor vendor ratings, review feedback comments & moderate customer reviews
          </Text>
        </div>
      </div>

      {/* Overview Cards */}
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
            Average Platform Rating
          </Text>
          <Text as="h2" variant="heading1" color="#14532D" style={{ marginTop: 4 }}>
            4.8 ⭐
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
            Published Reviews
          </Text>
          <Text as="h2" variant="heading1" color="#059669" style={{ marginTop: 4 }}>
            {reviews.filter((r) => r.status === 'PUBLISHED').length}
          </Text>
        </div>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #DC2626',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <Text as="span" variant="caption" color="#64748B">
            Flagged for Review
          </Text>
          <Text as="h2" variant="heading1" color="#DC2626" style={{ marginTop: 4 }}>
            {reviews.filter((r) => r.status === 'FLAGGED').length}
          </Text>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {(['ALL', 5, 4, 3, 2, 1] as const).map((star) => (
            <button
              key={String(star)}
              type="button"
              onClick={() => setRatingFilter(star)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: ratingFilter === star ? '#14532D' : '#F1F5F9',
                color: ratingFilter === star ? '#F59E0B' : '#475569',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {star === 'ALL' ? 'All Ratings' : `${star} ⭐`}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search reviews by customer, store, or comment..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            width: 340,
            fontSize: 14,
            outline: 'none',
          }}
        />
      </div>

      {/* Reviews Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#14532D', fontWeight: 700 }}>
              <th style={{ padding: '14px 20px' }}>Customer & Store</th>
              <th style={{ padding: '14px 20px' }}>Ratings</th>
              <th style={{ padding: '14px 20px' }}>Feedback Comment</th>
              <th style={{ padding: '14px 20px' }}>Created</th>
              <th style={{ padding: '14px 20px' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Moderation Actions</th>
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
                  <div style={{ fontWeight: 800, color: '#D97706' }}>Store: {r.rating} ⭐</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Delivery: {r.deliveryRating} ⭐</div>
                </td>
                <td style={{ padding: '16px 20px', color: '#334155', maxWidth: 380, lineHeight: 1.4 }}>
                  &ldquo;{r.comment}&rdquo;
                </td>
                <td style={{ padding: '16px 20px', color: '#64748B', fontSize: 12 }}>{r.createdAt}</td>
                <td style={{ padding: '16px 20px' }}>
                  <span
                    style={{
                      backgroundColor:
                        r.status === 'PUBLISHED' ? '#D1FAE5' : r.status === 'FLAGGED' ? '#FEF3C7' : '#FEE2E2',
                      color:
                        r.status === 'PUBLISHED' ? '#047857' : r.status === 'FLAGGED' ? '#B45309' : '#B91C1C',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: 20,
                    }}
                  >
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                    {r.status !== 'PUBLISHED' ? (
                      <button
                        type="button"
                        onClick={() => handleModeration(r.id, 'PUBLISHED')}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#D1FAE5',
                          color: '#047857',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Approve
                      </button>
                    ) : null}
                    {r.status !== 'HIDDEN' ? (
                      <button
                        type="button"
                        onClick={() => handleModeration(r.id, 'HIDDEN')}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#FEE2E2',
                          color: '#991B1B',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Hide
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
          ⭐ {toastMsg}
        </div>
      ) : null}
    </div>
  );
}

