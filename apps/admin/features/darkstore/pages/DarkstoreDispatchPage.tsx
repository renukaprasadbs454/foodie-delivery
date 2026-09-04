'use client';

import React, { useState } from 'react';
import type { DarkstoreOrder } from '../types';

export function DarkstoreDispatchPage() {
  const [dispatchOrders, setDispatchOrders] = useState<DarkstoreOrder[]>([
    {
      id: 'do111111-1111-1111-1111-111111111111',
      orderNumber: 'FD-10234',
      darkstoreId: 'd0000000-0000-0000-0000-000000000001',
      customerName: 'Aarav Mehta',
      customerPhone: '+91 98999 12345',
      deliveryAddress: 'Flat 402, Green Acres, 12th Main Indiranagar',
      totalAmount: 101.0,
      status: 'READY_FOR_DISPATCH',
      priority: 'HIGH',
      assignedPicker: 'Karan Verma',
      assignedPacker: 'Pooja Nair',
      deliveryPartnerName: 'Vikram Choudhary',
      deliveryPartnerPhone: '+91 98111 22233',
      pickupStatus: 'WAITING_FOR_PARTNER',
      createdAt: '2026-08-26T12:30:00Z',
      updatedAt: '2026-08-26T12:45:00Z',
      items: [],
    },
  ]);

  const handleHandover = (orderId: string) => {
    setDispatchOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'DISPATCHED', pickupStatus: 'DISPATCHED' } : o))
    );
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
           Dispatch Bay & Delivery Partner Coordination
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
          Monitor orders ready for pickup and manage delivery partner handoff at the gate.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {dispatchOrders.map((o) => (
          <div
            key={o.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 20,
              border: o.status === 'DISPATCHED' ? '2px solid #10B981' : '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#0F3D21' }}>{o.orderNumber}</span>
                <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 4 }}>
                  {o.priority} PRIORITY
                </span>
                <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 4 }}>
                  {o.status}
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>
                Customer: <strong>{o.customerName}</strong> ({o.customerPhone}) | Address: {o.deliveryAddress}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                Delivery Partner: <strong>{o.deliveryPartnerName}</strong> ({o.deliveryPartnerPhone}) | Status:{' '}
                <strong style={{ color: '#D97706' }}>{o.pickupStatus}</strong>
              </div>
            </div>

            <div>
              {o.status !== 'DISPATCHED' ? (
                <button
                  type="button"
                  onClick={() => handleHandover(o.id)}
                  style={{
                    backgroundColor: '#0F3D21',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 20px',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Confirm Handoff & Dispatch 
                </button>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 800, color: '#15803D', backgroundColor: '#DCFCE7', padding: '8px 16px', borderRadius: 8 }}>
                   DISPATCHED AT GATE
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
