'use client';

import React, { useState } from 'react';
import type { DarkstoreStaff } from '../types';

export function DarkstoreStaffPage() {
  const [staffList, setStaffList] = useState<DarkstoreStaff[]>([
    {
      id: 'ds111111-1111-1111-1111-111111111111',
      darkstoreId: 'd0000000-0000-0000-0000-000000000001',
      name: 'Rajesh Sharma',
      phone: '+91 98111 00112',
      email: 'rajesh.darkstore@foodie.local',
      role: 'DARKSTORE_MANAGER',
      status: 'ACTIVE',
      activeTasksCount: 0,
      loginStatus: 'ONLINE',
      createdAt: '2026-08-26T10:00:00Z',
    },
    {
      id: 'ds222222-2222-2222-2222-222222222222',
      darkstoreId: 'd0000000-0000-0000-0000-000000000001',
      name: 'Karan Verma',
      phone: '+91 98222 00223',
      email: 'karan.picker@foodie.local',
      role: 'PICKER',
      status: 'ACTIVE',
      activeTasksCount: 2,
      loginStatus: 'ONLINE',
      createdAt: '2026-08-26T10:00:00Z',
    },
    {
      id: 'ds333333-3333-3333-3333-333333333333',
      darkstoreId: 'd0000000-0000-0000-0000-000000000001',
      name: 'Pooja Nair',
      phone: '+91 98333 00334',
      email: 'pooja.packer@foodie.local',
      role: 'PACKER',
      status: 'ACTIVE',
      activeTasksCount: 1,
      loginStatus: 'ONLINE',
      createdAt: '2026-08-26T10:00:00Z',
    },
  ]);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
           Darkstore Staff Management
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
          Role assignments, active pick/pack tasks, shift attendance, and staff directory.
        </p>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB', color: '#374151', fontWeight: 700 }}>
              <th style={{ padding: '14px 16px' }}>Staff Name</th>
              <th style={{ padding: '14px 16px' }}>Role</th>
              <th style={{ padding: '14px 16px' }}>Contact</th>
              <th style={{ padding: '14px 16px' }}>Active Tasks</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F3D21' }}>{s.name}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, backgroundColor: '#FEF3C7', color: '#92400E' }}>
                    {s.role}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: '#374151' }}>
                  {s.phone}
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{s.email}</div>
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#111827' }}>{s.activeTasksCount} Active Orders</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800, backgroundColor: '#DCFCE7', color: '#15803D' }}>
                    {s.loginStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
