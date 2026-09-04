'use client';

import React from 'react';
import Link from 'next/link';

export function RestaurantAdminDashboardPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
           Restaurant Partner Operations Portal
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
          Menu management, live kitchen orders, prep timers, and customer reviews for your restaurant branch.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>TODAY'S ORDERS</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0F3D21', marginTop: 4 }}>32 Orders</div>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>KITCHEN PREP TIME</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#15803D', marginTop: 4 }}>14 mins avg</div>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>RESTAURANT RATING</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#F59E0B', marginTop: 4 }}> 4.8 / 5.0</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <Link href="/restaurants" style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}></div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F3D21' }}>Restaurant Profile & Menu Management</div>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>Update menu items, set prices, toggle item availability, and edit operating hours.</p>
        </Link>
        <Link href="/orders" style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}></div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F3D21' }}>Kitchen Order Display</div>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>Accept incoming kitchen orders, mark items as preparing, and alert delivery partners when ready.</p>
        </Link>
      </div>
    </div>
  );
}
