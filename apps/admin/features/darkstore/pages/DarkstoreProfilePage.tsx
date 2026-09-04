'use client';

import React, { useState } from 'react';
import type { DarkstoreProfile } from '../types';

export function DarkstoreProfilePage() {
  const [profile, setProfile] = useState<DarkstoreProfile>({
    id: 'd0000000-0000-0000-0000-000000000001',
    code: 'DS-IND-101',
    name: 'Foodiee QuickStore Darkstore - Indiranagar',
    address: '100 Feet Rd, Indiranagar, Bengaluru, KA 560038',
    phone: '+91 98000 11223',
    status: 'OPEN',
    deliveryRadiusKm: 3.5,
    serviceableAreas: 'Indiranagar, Domlur, HAL 2nd Stage, Cambridge Layout',
    openTime: '06:00 AM',
    closeTime: '11:00 PM',
    staffCount: 12,
    activeOrdersCount: 5,
    totalProductsCount: 420,
  });

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
           Darkstore Operating Profile
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
          Darkstore location, delivery radius, operating hours, and quick-commerce service boundaries.
        </p>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F3D21', margin: 0 }}>{profile.name}</h2>
            <div style={{ fontSize: 12, color: '#6B7280' }}>Darkstore ID: {profile.code}</div>
          </div>
          <span style={{ padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, backgroundColor: profile.status === 'OPEN' ? '#DCFCE7' : '#FEE2E2', color: profile.status === 'OPEN' ? '#15803D' : '#B91C1C' }}>
            {profile.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13, marginBottom: 24 }}>
          <div><strong>Address:</strong> {profile.address}</div>
          <div><strong>Phone:</strong> {profile.phone}</div>
          <div><strong>Delivery Radius:</strong> {profile.deliveryRadiusKm} km</div>
          <div><strong>Operating Hours:</strong> {profile.openTime} - {profile.closeTime}</div>
          <div style={{ gridColumn: '1 / -1' }}><strong>Serviceable Areas:</strong> {profile.serviceableAreas}</div>
        </div>

        <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
          <div style={{ flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280' }}>Staff Count</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0F3D21' }}>{profile.staffCount}</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280' }}>Active Orders</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0F3D21' }}>{profile.activeOrdersCount}</div>
          </div>
          <div style={{ flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6B7280' }}>Catalog Products</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0F3D21' }}>{profile.totalProductsCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
