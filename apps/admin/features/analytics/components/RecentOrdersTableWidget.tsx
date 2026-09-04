'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { selectActiveModule } from '@/store/moduleSlice';

export interface RecentOrder {
  id: string;
  orderCode: string;
  customerName: string;
  restaurantName: string;
  module: string;
  itemsCount: number;
  totalAmount: number;
  paymentMethod: 'CARD' | 'CASH' | 'WALLET';
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELED';
  createdAt: string;
}

const MOCK_RECENT_ORDERS: RecentOrder[] = [
  { id: '101', orderCode: '#ORD-9821', customerName: 'Aarav Mehta', restaurantName: 'Royal Biryani House', module: 'North Indian & Biryani', itemsCount: 3, totalAmount: 42.50, paymentMethod: 'CARD', status: 'DELIVERED', createdAt: '2 mins ago' },
  { id: '102', orderCode: '#ORD-9820', customerName: 'Neha Kapoor', restaurantName: 'Bella Italia Pizzeria', module: 'Italian & Wood-Fired Pizza', itemsCount: 2, totalAmount: 34.00, paymentMethod: 'WALLET', status: 'OUT_FOR_DELIVERY', createdAt: '8 mins ago' },
  { id: '103', orderCode: '#ORD-9819', customerName: 'Suresh Kumar', restaurantName: 'Sweet Dreams Bakery', module: 'Bakery & Desserts', itemsCount: 4, totalAmount: 58.20, paymentMethod: 'CARD', status: 'PROCESSING', createdAt: '15 mins ago' },
  { id: '104', orderCode: '#ORD-9818', customerName: 'Ananya Verma', restaurantName: 'The Gourmet Burger Bistro', module: 'Burgers & Fast Food', itemsCount: 1, totalAmount: 18.90, paymentMethod: 'CASH', status: 'CONFIRMED', createdAt: '22 mins ago' },
  { id: '105', orderCode: '#ORD-9817', customerName: 'Vikram Singh', restaurantName: 'Dragon Bowl Asian Kitchen', module: 'Chinese & Pan-Asian', itemsCount: 2, totalAmount: 29.50, paymentMethod: 'CARD', status: 'PENDING', createdAt: '29 mins ago' },
];

function getStatusBadge(status: RecentOrder['status']) {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', color: '#D97706', bg: '#FEF3C7' };
    case 'CONFIRMED':
      return { label: 'Confirmed', color: '#2563EB', bg: '#EFF6FF' };
    case 'PROCESSING':
      return { label: 'Packaging', color: '#7C3AED', bg: '#F3E8FF' };
    case 'OUT_FOR_DELIVERY':
      return { label: 'In Transit', color: '#EA580C', bg: '#FFEDD5' };
    case 'DELIVERED':
      return { label: 'Delivered', color: '#166534', bg: '#DCFCE7' };
    case 'CANCELED':
      return { label: 'Canceled', color: '#DC2626', bg: '#FEE2E2' };
  }
}

interface Props {
  orders?: RecentOrder[];
}

export function RecentOrdersTableWidget({ orders = [] }: Props) {
  const router = useRouter();
  const activeModule = useAppSelector(selectActiveModule);
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);

  const filteredOrders = orders.filter((ord) => {
    if (activeModule === 'FOOD') return true;
    if (activeModule === 'RESTAURANTS') return ord.module.includes('Indian') || ord.module.includes('Italian') || ord.module.includes('Pizza');
    if (activeModule === 'CAFES') return ord.module.includes('Bakery') || ord.module.includes('Desserts') || ord.module.includes('Cafe');
    if (activeModule === 'CLOUD_KITCHEN') return ord.module.includes('Burgers') || ord.module.includes('Fast Food') || ord.module.includes('Asian');
    return true;
  });

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: '22px 24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 14px 0 rgba(20, 83, 45, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#14532D', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Live Recent Orders Activity Stream</span>
            <span style={{ height: 8, width: 8, borderRadius: '50%', backgroundColor: '#22C55E' }} className="pulse-live" />
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            Latest incoming transactions across customer app & delivery partners
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push('/orders')}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#14532D',
            backgroundColor: '#F0FDF4',
            border: '1px solid #BBF7D0',
            padding: '6px 12px',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          View Full Order Book
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569' }}>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Order ID</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Customer</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Store / Vendor</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Total</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Payment</th>
              <th style={{ padding: '12px 14px', fontWeight: 700 }}>Status</th>
              <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>
                  No recent orders available.
                </td>
              </tr>
            ) : (
              filteredOrders.map((ord) => {
                const badge = getStatusBadge(ord.status);
                return (
                  <tr
                    key={ord.id}
                    style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#14532D' }}>{ord.orderCode}</td>
                    <td style={{ padding: '12px 14px', color: '#1E293B', fontWeight: 600 }}>{ord.customerName}</td>
                    <td style={{ padding: '12px 14px', color: '#475569' }}>{ord.restaurantName}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: '#1E293B' }}>₹{ord.totalAmount.toFixed(2)}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: 4 }}>
                        {ord.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: badge.color,
                          backgroundColor: badge.bg,
                          padding: '4px 10px',
                          borderRadius: 20,
                          display: 'inline-block',
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(ord)}
                        style={{
                          padding: '5px 10px',
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#14532D',
                          backgroundColor: '#FEF3C7',
                          border: '1px solid #FDE68A',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        Quick View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Quick View Drawer Modal */}
      {selectedOrder ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: '#FFFFFF',
              height: '100%',
              padding: '24px',
              boxShadow: '-10px 0 25px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#14532D' }}>Order {selectedOrder.orderCode}</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>Created {selectedOrder.createdAt}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Customer Details</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginTop: 2 }}>{selectedOrder.customerName}</div>
                <div style={{ color: '#64748B', marginTop: 2 }}>Payment via {selectedOrder.paymentMethod}</div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Store Details</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginTop: 2 }}>{selectedOrder.restaurantName}</div>
                <div style={{ color: '#64748B', marginTop: 2 }}>{selectedOrder.itemsCount} Food items included</div>
              </div>

              <div style={{ backgroundColor: '#FEF3C7', padding: 14, borderRadius: 10, border: '1px solid #FDE68A' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F3D21' }}>Total Amount Paid</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#14532D' }}>₹{selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #E2E8F0', display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => {
                  router.push('/orders');
                  setSelectedOrder(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#14532D',
                  color: '#F59E0B',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Go to Order Details
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
