'use client';

import React from 'react';

interface TopRestaurant {
  id: string;
  name: string;
  category: string;
  rating: number;
  ordersCount: number;
  image: string;
}

interface TopItem {
  id: string;
  name: string;
  restaurant: string;
  price: number;
  salesCount: number;
  icon: string;
}

const MOCK_RESTAURANTS: TopRestaurant[] = [
  { id: '1', name: 'The Gourmet Kitchen', category: 'Continental', rating: 4.9, ordersCount: 1420, image: '🍽️' },
  { id: '2', name: 'Spice Garden India', category: 'North Indian', rating: 4.8, ordersCount: 1180, image: '🍛' },
  { id: '3', name: 'Tokyo Sushi & Ramen Bar', category: 'Japanese', rating: 4.7, ordersCount: 950, image: '🍣' },
  { id: '4', name: 'Bella Italia Pizzeria', category: 'Italian', rating: 4.8, ordersCount: 890, image: '🍕' },
];

const MOCK_ITEMS: TopItem[] = [
  { id: '1', name: 'Truffle Mushroom Burger', restaurant: 'The Gourmet Kitchen', price: 18.5, salesCount: 680, icon: '🍔' },
  { id: '2', name: 'Butter Chicken & Garlic Naan', restaurant: 'Spice Garden India', price: 22.0, salesCount: 540, icon: '🥘' },
  { id: '3', name: 'Dragon Roll Sushi Box', restaurant: 'Tokyo Sushi & Ramen Bar', price: 26.9, salesCount: 490, icon: '🍱' },
  { id: '4', name: 'Wood-fired Pepperoni Pizza', restaurant: 'Bella Italia Pizzeria', price: 19.9, salesCount: 430, icon: '🍕' },
];

export function TopPerformersWidget() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 20,
      }}
    >
      {/* Panel 1: Top Restaurants */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          padding: '20px 22px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 14px 0 rgba(20, 83, 45, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#14532D', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🏆 Top Rated Stores</span>
          </div>
          <a href="/restaurants" style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>
            View All ➔
          </a>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MOCK_RESTAURANTS.map((res, index) => (
            <div
              key={res.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 10,
                backgroundColor: '#F8FAFC',
                border: '1px solid #F1F5F9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', width: 14 }}>#{index + 1}</span>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#FEF3C7',
                    border: '1px solid #FDE68A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  {res.image}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{res.name}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{res.category}</div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                  <span>⭐</span>
                  <span>{res.rating}</span>
                </div>
                <div style={{ fontSize: 11, color: '#166534', fontWeight: 600 }}>{res.ordersCount} orders</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Panel 2: Top Selling Products */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 14,
          padding: '20px 22px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 14px 0 rgba(20, 83, 45, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#14532D', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🔥 Trending Popular Items</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', backgroundColor: '#F1F5F9', padding: '2px 8px', borderRadius: 10 }}>
            Top Volume
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MOCK_ITEMS.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 10,
                backgroundColor: '#F8FAFC',
                border: '1px solid #F1F5F9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', width: 14 }}>#{index + 1}</span>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#DCFCE7',
                    border: '1px solid #BBF7D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{item.restaurant}</div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#14532D' }}>${item.price.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{item.salesCount} sold</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
