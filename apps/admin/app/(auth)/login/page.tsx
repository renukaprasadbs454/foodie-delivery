'use client';

import React from 'react';
import { AdminLoginForm } from '@/features/auth/AdminLoginForm';

/**
 * Foodie Admin Console — Email & Password Login Page.
 */
export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0E1712',
        backgroundImage: 'radial-gradient(circle at 50% 20%, #14532D 0%, #0E1712 70%)',
        padding: '32px 16px',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Brand Header Banner */}
        <div
          style={{
            backgroundColor: '#0F3D21',
            padding: '28px 32px',
            color: '#FFFFFF',
            borderBottom: '4px solid #10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px' }}>
                Foodie <span style={{ color: '#F59E0B' }}>Admin</span>
              </div>
              <div style={{ fontSize: 11, color: '#A7F3D0', fontWeight: 600 }}>
                Hyperlocal Operations Portal
              </div>
            </div>
          </div>
        </div>

        {/* Form Body Container */}
        <div style={{ padding: '32px 32px 36px 32px' }}>
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}


