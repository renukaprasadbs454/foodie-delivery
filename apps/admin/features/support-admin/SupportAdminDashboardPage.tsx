'use client';

import React from 'react';
import Link from 'next/link';

export function SupportAdminDashboardPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
           Customer Support & Resolution Portal
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
          Customer order tracking, issue ticket escalations, food quality complaints, and delivery partner support.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>OPEN SUPPORT TICKETS</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#D97706', marginTop: 4 }}>14 Active</div>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>UNASSIGNED DELIVERIES</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#B91C1C', marginTop: 4 }}>2 Orders</div>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>AVG RESOLUTION TIME</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#15803D', marginTop: 4 }}>4.5 mins</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        <Link href="/orders" style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}></div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F3D21' }}>Order Tracking & Live Status</div>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>Search customer orders, view preparation/delivery status, and contact delivery partners.</p>
        </Link>
        <Link href="/reviews" style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}></div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0F3D21' }}>Reviews & Customer Complaints</div>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0 0' }}>Moderate ratings, review customer feedback, and trigger compensation vouchers.</p>
        </Link>
      </div>
    </div>
  );
}
