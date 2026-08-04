'use client';

import React from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectIsConnected } from '@/store/connectivitySlice';

/**
 * P2-XAP-02 shell-level offline banner for admin web.
 * Feature pages still own action-specific blocking and cached-state copy.
 */
export function ConnectivityBanner() {
  const isConnected = useAppSelector(selectIsConnected);

  if (isConnected) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        background: '#6a2716',
        color: '#fff4ee',
        borderBottom: '1px solid #cf8b76',
        padding: '10px 16px',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
        Offline mode
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.5 }}>
        Cached data may be shown. Sign-in, approvals, overrides, and refunds
        stay blocked until connectivity returns.
      </div>
    </div>
  );
}
