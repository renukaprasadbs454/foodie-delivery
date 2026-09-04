'use client';

import React from 'react';
import Link from 'next/link';

export default function MembersHubPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F3D21', margin: '0 0 6px 0' }}>
           Platform Members & Stakeholder Management
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>
          Centralized management studio for all Foodie platform members: Admin Staff, Customers, Merchants, and Deliverymen.
        </p>
      </div>

      {/* Member Management Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {/* Card 1: Users (Admin & Staff Users) */}
        <Link
          href="/users"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            border: '1.5px solid #0F3D21',
            boxShadow: '0 4px 14px rgba(15, 61, 33, 0.1)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 24 }}></span>
            <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: 6 }}>
              FEATURED
            </span>
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F3D21', margin: '0 0 6px 0' }}>
              Platform Users & Staff
            </h3>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Provision administrative staff accounts, assign system roles (Super Admin, Ops, Finance, Support), and edit privileges.
            </p>
          </div>
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F3D21' }}>
              Provision • Role Privileges • Directory
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F3D21' }}>→</span>
          </div>
        </Link>

        {/* Card 2: Customers */}
        <Link
          href="/customers"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 24 }}></span>
            <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#E0E7FF', color: '#3730A3', padding: '3px 8px', borderRadius: 6 }}>
              CONSUMERS
            </span>
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F3D21', margin: '0 0 6px 0' }}>
              Customers Operations
            </h3>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Manage end-user customer profiles, review lifetime spend (LTV), process support tickets, and manage account blocks.
            </p>
          </div>
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#3730A3' }}>
              Directory • Support Desk • Block Controls
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F3D21' }}>→</span>
          </div>
        </Link>

        {/* Card 3: Restaurants */}
        <Link
          href="/restaurants"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 24 }}></span>
            <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: 6 }}>
              MERCHANTS
            </span>
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F3D21', margin: '0 0 6px 0' }}>
              Restaurants & Outlets
            </h3>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Onboard food vendors, approve restaurant applications, set commission rates, and manage outlet statuses.
            </p>
          </div>
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#B45309' }}>
              Onboarding • Commission • Approval
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F3D21' }}>→</span>
          </div>
        </Link>

        {/* Card 4: Delivery Partners */}
        <Link
          href="/delivery-partners"
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 24 }}></span>
            <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#FCE7F3', color: '#9D174D', padding: '3px 8px', borderRadius: 6 }}>
              LOGISTICS
            </span>
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F3D21', margin: '0 0 6px 0' }}>
              Delivery Partners
            </h3>
            <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
              Verify driver identity and KYC documents, approve delivery partners, and track fleet availability.
            </p>
          </div>
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9D174D' }}>
              KYC Verification • Fleet Status
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F3D21' }}>→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
