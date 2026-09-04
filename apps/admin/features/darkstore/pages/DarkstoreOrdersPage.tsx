'use client';

import React, { useState } from 'react';
import type { DarkstoreOrder, DarkstoreOrderStatus } from '../types';

export function DarkstoreOrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<DarkstoreOrder | null>(null);

  const [orders, setOrders] = useState<DarkstoreOrder[]>([
    {
      id: 'do111111-1111-1111-1111-111111111111',
      orderNumber: 'FD-10234',
      darkstoreId: 'd0000000-0000-0000-0000-000000000001',
      customerName: 'Aarav Mehta',
      customerPhone: '+91 98999 12345',
      deliveryAddress: 'Flat 402, Green Acres, 12th Main Indiranagar',
      totalAmount: 991.0,
      status: 'PICKING',
      priority: 'HIGH',
      assignedPicker: 'Karan Verma',
      assignedPacker: 'Pooja Nair',
      deliveryPartnerName: 'Vikram Choudhary',
      deliveryPartnerPhone: '+91 98111 22233',
      pickupStatus: 'WAITING_FOR_PARTNER',
      createdAt: '2026-08-26T12:30:00Z',
      updatedAt: '2026-08-26T12:35:00Z',
      items: [
        {
          id: 'doi11111-1111-1111-1111-111111111111',
          productId: 'dp111111-0000-0000-0000-000000000001',
          sku: 'MILK-AMUL-500ML',
          productName: 'Amul Taaza Toned Fresh Milk 500ml',
          shelfLocation: 'Shelf A-01 (Cooler)',
          quantityRequested: 2,
          quantityPicked: 2,
          unitPrice: 28.0,
          status: 'PICKED',
        },
        {
          id: 'doi22222-2222-2222-2222-222222222222',
          productId: 'dp222222-0000-0000-0000-000000000002',
          sku: 'BREAD-BRIT-400G',
          productName: 'Britannia Brown Bread Whole Wheat 400g',
          shelfLocation: 'Shelf A-12',
          quantityRequested: 1,
          quantityPicked: 0,
          unitPrice: 45.0,
          status: 'PENDING',
        },
        {
          id: 'doi33333-3333-3333-3333-333333333333',
          productId: 'dp444444-0000-0000-0000-000000000004',
          sku: 'COKE-ZERO-330ML',
          productName: 'Coca-Cola Zero Sugar Can 330ml',
          shelfLocation: 'Shelf C-08 (Chiller)',
          quantityRequested: 2,
          quantityPicked: 1,
          unitPrice: 38.0,
          status: 'PENDING',
        },
        {
          id: 'doi44444-4444-4444-4444-444444444444',
          productId: 'dp333333-0000-0000-0000-000000000003',
          sku: 'CHIPS-LAYS-MAGIC-50G',
          productName: "Lay's India's Magic Masala Chips 50g",
          shelfLocation: 'Shelf B-04 (Snacks)',
          quantityRequested: 3,
          quantityPicked: 0,
          unitPrice: 20.0,
          status: 'PENDING',
        },
        {
          id: 'doi55555-5555-5555-5555-555555555555',
          productId: 'dp555555-0000-0000-0000-000000000005',
          sku: 'YOGURT-EPIG-85G',
          productName: 'Epigamia Greek Yogurt Natural 85g',
          shelfLocation: 'Shelf A-05 (Cooler)',
          quantityRequested: 2,
          quantityPicked: 0,
          unitPrice: 55.0,
          status: 'PENDING',
        },
        {
          id: 'doi66666-6666-6666-6666-666666666666',
          productId: 'dp666666-0000-0000-0000-000000000006',
          sku: 'CHOC-FERRERO-16P',
          productName: 'Ferrero Rocher Premium Chocolate Box 16 Pcs',
          shelfLocation: 'Shelf D-02 (Premium)',
          quantityRequested: 1,
          quantityPicked: 0,
          unitPrice: 499.0,
          status: 'PENDING',
        },
        {
          id: 'doi77777-7777-7777-7777-777777777777',
          productId: 'dp777777-0000-0000-0000-000000000007',
          sku: 'OIL-FORTUNE-1L',
          productName: 'Fortune Sunlite Refined Sunflower Oil 1L',
          shelfLocation: 'Shelf E-10 (Pantry)',
          quantityRequested: 1,
          quantityPicked: 0,
          unitPrice: 145.0,
          status: 'PENDING',
        },
      ],
    },
    {
      id: 'do222222-2222-2222-2222-222222222222',
      orderNumber: 'FD-10235',
      darkstoreId: 'd0000000-0000-0000-0000-000000000001',
      customerName: 'Sneha Kapoor',
      customerPhone: '+91 98888 67890',
      deliveryAddress: 'Villa 14, Palm Grove, Domlur',
      totalAmount: 66.0,
      status: 'NEW',
      priority: 'NORMAL',
      pickupStatus: 'WAITING_FOR_PARTNER',
      createdAt: '2026-08-26T12:40:00Z',
      updatedAt: '2026-08-26T12:40:00Z',
      items: [
        {
          id: 'doi33333-3333-3333-3333-333333333333',
          productId: 'dp444444-0000-0000-0000-000000000004',
          sku: 'COKE-ZERO-330ML',
          productName: 'Coca-Cola Zero Sugar Can 330ml',
          shelfLocation: 'Shelf C-08 (Chiller)',
          quantityRequested: 2,
          quantityPicked: 0,
          unitPrice: 38.0,
          status: 'PENDING',
        },
      ],
    },
  ]);

  const handleUpdateStatus = (orderId: string, nextStatus: DarkstoreOrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus, updatedAt: new Date().toISOString() } : o))
    );
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
          Darkstore Order Management
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
          Full quick-commerce order lifecycle: <code>New → Accepted → Picking → Packing → Ready → Dispatched → Delivered</code>.
        </p>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: 20,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          placeholder="Search by Order #, Customer, Phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '8px 14px',
            borderRadius: 8,
            border: '1px solid #D1D5DB',
            fontSize: 13,
            minWidth: 260,
          }}
        />

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['ALL', 'NEW', 'ACCEPTED', 'PICKING', 'PACKING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CANCELLED'].map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === st ? '#0F3D21' : '#F3F4F6',
                  color: statusFilter === st ? '#FFFFFF' : '#374151',
                }}
              >
                {st}
              </button>
            )
          )}
        </div>
      </div>

      {/* Orders List Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB', color: '#374151', fontWeight: 700 }}>
              <th style={{ padding: '14px 16px' }}>Order #</th>
              <th style={{ padding: '14px 16px' }}>Customer</th>
              <th style={{ padding: '14px 16px' }}>Items</th>
              <th style={{ padding: '14px 16px' }}>Amount</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px' }}>Assigned Staff</th>
              <th style={{ padding: '14px 16px' }}>Workflow Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F3D21' }}>{o.orderNumber}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ fontWeight: 700, color: '#111827' }}>{o.customerName}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{o.customerPhone}</div>
                </td>
                <td style={{ padding: '14px 16px', color: '#374151' }}>
                  {o.items.length} items (Picked: {o.items.filter((i) => i.status === 'PICKED').length}/{o.items.length})
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#111827' }}>₹{o.totalAmount.toFixed(2)}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 800,
                      backgroundColor:
                        o.status === 'NEW'
                          ? '#FEF3C7'
                          : o.status === 'PICKING'
                          ? '#DBEAFE'
                          : o.status === 'PACKING'
                          ? '#EDE9FE'
                          : o.status === 'READY_FOR_DISPATCH'
                          ? '#DCFCE7'
                          : '#F3F4F6',
                      color:
                        o.status === 'NEW'
                          ? '#92400E'
                          : o.status === 'PICKING'
                          ? '#1E40AF'
                          : o.status === 'PACKING'
                          ? '#6D28D9'
                          : o.status === 'READY_FOR_DISPATCH'
                          ? '#15803D'
                          : '#374151',
                    }}
                  >
                    {o.status}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', fontSize: 12, color: '#4B5563' }}>
                  Picker: {o.assignedPicker || 'Unassigned'}
                  <br />
                  Packer: {o.assignedPacker || 'Unassigned'}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {o.status === 'NEW' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(o.id, 'ACCEPTED')}
                        style={{
                          backgroundColor: '#0F3D21',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Accept Order
                      </button>
                    )}
                    {o.status === 'ACCEPTED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(o.id, 'PICKING')}
                        style={{
                          backgroundColor: '#1D4ED8',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Start Picking
                      </button>
                    )}
                    {o.status === 'PICKING' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(o.id, 'PACKING')}
                        style={{
                          backgroundColor: '#6D28D9',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Move to Packing
                      </button>
                    )}
                    {o.status === 'PACKING' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(o.id, 'READY_FOR_DISPATCH')}
                        style={{
                          backgroundColor: '#15803D',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Mark Ready for Dispatch
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(o)}
                      style={{
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        border: '1px solid #D1D5DB',
                        padding: '6px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Details 
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, maxWidth: 600, width: '100%' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F3D21', margin: '0 0 16px' }}>
              Order Details — {selectedOrder.orderNumber}
            </h2>

            <div style={{ fontSize: 13, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div><strong>Customer:</strong> {selectedOrder.customerName}</div>
              <div><strong>Phone:</strong> {selectedOrder.customerPhone}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {selectedOrder.deliveryAddress}</div>
              <div><strong>Status:</strong> {selectedOrder.status}</div>
              <div><strong>Priority:</strong> {selectedOrder.priority}</div>
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#374151', marginBottom: 8 }}>Order Items</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', border: '1px solid #E5E7EB', borderRadius: 8 }}>
              {selectedOrder.items.map((i) => (
                <li key={i.id} style={{ padding: '10px 14px', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <div>
                    <strong style={{ color: '#0F3D21' }}>{i.productName}</strong> ({i.sku})
                    <div style={{ fontSize: 11, color: '#6B7280' }}> Location: {i.shelfLocation}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div>Qty: {i.quantityRequested} | Picked: {i.quantityPicked}</div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: i.status === 'PICKED' ? '#15803D' : '#92400E' }}>{i.status}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ backgroundColor: '#0F3D21', color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
