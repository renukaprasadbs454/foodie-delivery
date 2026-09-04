'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Text, trackAnalyticsEvent, useTheme } from 'foodie-shared-web';
import { GAP_API_16_ORDER_LIST } from '@/constants/gaps';
import { useAppSelector } from '@/store/hooks';
import { selectActiveModule } from '@/store/moduleSlice';
import { OrderOperationalPipeline } from '@/features/analytics/components/OrderOperationalPipeline';

export interface OrderItemRecord {
  id: string;
  customerName: string;
  customerPhone: string;
  storeName: string;
  module: string;
  itemsSummary: string;
  totalAmount: number;
  paymentMethod: 'COD' | 'DIGITAL';
  status: 'PENDING' | 'PREPARING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELED';
  createdAt: string;
}

const MOCK_ORDERS: OrderItemRecord[] = [
  {
    id: 'a1b2c3d4-0001-4000-8000-111122223333',
    customerName: 'Aarav Mehta',
    customerPhone: '+91 98765 00001',
    storeName: 'Royal Biryani House',
    module: 'North Indian & Biryani',
    itemsSummary: '2x Chicken Dum Biryani, 1x Butter Naan, 1x Raita',
    totalAmount: 680,
    paymentMethod: 'DIGITAL',
    status: 'PREPARING',
    createdAt: '10 mins ago',
  },
  {
    id: 'e5f6a7b8-0005-4000-8000-555566667777',
    customerName: 'Ananya Sharma',
    customerPhone: '+91 98765 00005',
    storeName: 'Punjab Grill & Spice',
    module: 'North Indian & Tandoori',
    itemsSummary: '1x Paneer Tikka Masala, 2x Garlic Naan, 1x Mango Lassi',
    totalAmount: 620,
    paymentMethod: 'DIGITAL',
    status: 'READY_FOR_PICKUP',
    createdAt: '15 mins ago',
  },
  {
    id: 'b2c3d4e5-0002-4000-8000-222233334444',
    customerName: 'Neha Kapoor',
    customerPhone: '+91 98765 00002',
    storeName: 'Bella Italia Pizzeria',
    module: 'Italian Pizza',
    itemsSummary: '1x Wood-Fired Pepperoni Pizza, 2x Garlic Bread',
    totalAmount: 850,
    paymentMethod: 'COD',
    status: 'OUT_FOR_DELIVERY',
    createdAt: '25 mins ago',
  },
  {
    id: 'c3d4e5f6-0003-4000-8000-333344445555',
    customerName: 'Rohan Gupta',
    customerPhone: '+91 98765 00003',
    storeName: 'Sweet Dreams Bakery',
    module: 'Bakery & Desserts',
    itemsSummary: '1x Chocolate Truffle Cake, 2x Cappuccino Coffee',
    totalAmount: 540,
    paymentMethod: 'DIGITAL',
    status: 'PENDING',
    createdAt: '5 mins ago',
  },
  {
    id: 'd4e5f6a7-0004-4000-8000-444455556666',
    customerName: 'Kavita Reddy',
    customerPhone: '+91 98765 00004',
    storeName: 'The Gourmet Burger Bistro',
    module: 'Burgers & Fries',
    itemsSummary: '1x Double Cheese Burger, 1x Peri Peri Fries, 1x Coke',
    totalAmount: 510,
    paymentMethod: 'DIGITAL',
    status: 'DELIVERED',
    createdAt: '1 hour ago',
  },
];

export function OrdersPage() {
  const { tokens } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') ?? 'ALL';
  const activeModule = useAppSelector(selectActiveModule);

  const [orders, setOrders] = useState<OrderItemRecord[]>(MOCK_ORDERS);
  const [searchUuid, setSearchUuid] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);

  useEffect(() => {
    trackAnalyticsEvent('admin_orders_viewed', {
      gapId: GAP_API_16_ORDER_LIST,
    });
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter || (statusFilter === 'PROCESSING' && o.status === 'PREPARING');
    const matchesSearch =
      searchUuid === '' ||
      o.id.toLowerCase().includes(searchUuid.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchUuid.toLowerCase()) ||
      o.storeName.toLowerCase().includes(searchUuid.toLowerCase());

    let matchesModule = true;
    if (activeModule === 'RESTAURANTS') {
      matchesModule = o.module.includes('Indian') || o.module.includes('Italian') || o.module.includes('Pizza');
    } else if (activeModule === 'CAFES') {
      matchesModule = o.module.includes('Bakery') || o.module.includes('Desserts') || o.module.includes('Cafe');
    } else if (activeModule === 'CLOUD_KITCHEN') {
      matchesModule = o.module.includes('Burgers') || o.module.includes('Fries') || o.module.includes('Fast Food');
    }

    return matchesStatus && matchesSearch && matchesModule;
  });


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Text as="h1" variant="heading1" color="#14532D">
            Order Dispatch Control Center
          </Text>
          <Text as="p" variant="caption" color="#64748B">
            Real-time multi-vendor order tracking, dispatch management & status overrides
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', padding: '6px 12px', borderRadius: 20 }}>
          <span style={{ fontSize: 14 }}></span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#D97706' }}>Live WebSocket Dispatch Feed</span>
        </div>
      </div>

      {/* Live Order Operational Pipeline */}
      <OrderOperationalPipeline totalOrders={324} />

      {/* Orders Filter Toolbar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['ALL', 'PENDING', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: statusFilter === st ? '#14532D' : '#F1F5F9',
                color: statusFilter === st ? '#F59E0B' : '#475569',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {st === 'ALL' ? 'ALL ORDERS' : st.replace(/_/g, ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by Order ID, Customer, or Store..."
          value={searchUuid}
          onChange={(e) => setSearchUuid(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            width: 320,
            fontSize: 14,
            outline: 'none',
          }}
        />
      </div>

      {/* Orders Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#14532D', fontWeight: 700 }}>
              <th style={{ padding: '14px 20px' }}>Order ID</th>
              <th style={{ padding: '14px 20px' }}>Customer</th>
              <th style={{ padding: '14px 20px' }}>Store & Module</th>
              <th style={{ padding: '14px 20px' }}>Items Summary</th>
              <th style={{ padding: '14px 20px' }}>Amount & Pay</th>
              <th style={{ padding: '14px 20px' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 700, color: '#14532D', fontFamily: 'monospace', fontSize: 12 }}>
                    #{order.id.slice(0, 8)}...
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>{order.createdAt}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, color: '#334155' }}>{order.customerName}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{order.customerPhone}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, color: '#14532D' }}>{order.storeName}</div>
                  <span style={{ fontSize: 11, color: '#D97706', fontWeight: 600 }}>{order.module}</span>
                </td>
                <td style={{ padding: '16px 20px', color: '#475569', fontSize: 13 }}>{order.itemsSummary}</td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 700, color: '#14532D' }}>₹{order.totalAmount}</div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      backgroundColor: order.paymentMethod === 'DIGITAL' ? '#E0F2FE' : '#FEF3C7',
                      color: order.paymentMethod === 'DIGITAL' ? '#0369A1' : '#B45309',
                    }}
                  >
                    {order.paymentMethod}
                  </span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span
                    style={{
                      backgroundColor:
                        order.status === 'DELIVERED'
                          ? '#D1FAE5'
                          : order.status === 'READY_FOR_PICKUP'
                          ? '#E0E7FF'
                          : order.status === 'OUT_FOR_DELIVERY' || order.status === 'PREPARING'
                          ? '#FEF3C7'
                          : order.status === 'PENDING'
                          ? '#E0F2FE'
                          : '#FEE2E2',
                      color:
                        order.status === 'DELIVERED'
                          ? '#047857'
                          : order.status === 'READY_FOR_PICKUP'
                          ? '#3730A3'
                          : order.status === 'OUT_FOR_DELIVERY' || order.status === 'PREPARING'
                          ? '#B45309'
                          : order.status === 'PENDING'
                          ? '#0369A1'
                          : '#B91C1C',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 20,
                    }}
                  >
                    {order.status === 'READY_FOR_PICKUP' ? 'READY FOR PICKUP' : order.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  {order.status === 'PREPARING' && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrders((prev) =>
                          prev.map((o) => (o.id === order.id ? { ...o, status: 'READY_FOR_PICKUP' } : o)),
                        );
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#E0E7FF',
                        color: '#3730A3',
                        border: '1px solid #C7D2FE',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginRight: 8,
                      }}
                    >
                      Mark Ready for Pickup
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => router.push(`/orders/${order.id}`)}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: '#14532D',
                      color: '#F59E0B',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Manage Order
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
