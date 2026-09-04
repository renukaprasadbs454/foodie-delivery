'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { DarkstoreMetrics, DarkstoreOrder } from '../types';

export function DarkstoreDashboardPage() {
  const [metrics] = useState<DarkstoreMetrics>({
    totalOrders: 10,
    newOrders: 2,
    ordersBeingPicked: 3,
    ordersReadyForDispatch: 2,
    completedOrders: 3,
    cancelledOrders: 0,
    lowStockProducts: 1,
    outOfStockProducts: 1,
    totalProducts: 4,
    todaysRevenue: 167.0,
    averageOrderValue: 83.5,
    pendingActionsCount: 7,
  });

  const [activeOrders] = useState<DarkstoreOrder[]>([
    {
      id: 'do111111-1111-1111-1111-111111111111',
      orderNumber: 'FD-10234',
      darkstoreId: 'd0000000-0000-0000-0000-000000000001',
      customerName: 'Aarav Mehta',
      customerPhone: '+91 98999 12345',
      deliveryAddress: 'Flat 402, Green Acres, 12th Main Indiranagar',
      totalAmount: 101.0,
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

  const kpiCards = [
    { title: 'Total Orders', value: metrics.totalOrders, color: '#0F3D21', icon: '', bg: '#DCFCE7' },
    { title: 'New Orders', value: metrics.newOrders, color: '#B45309', icon: '', bg: '#FEF3C7' },
    { title: 'Picking in Progress', value: metrics.ordersBeingPicked, color: '#1D4ED8', icon: '', bg: '#DBEAFE' },
    { title: 'Ready for Dispatch', value: metrics.ordersReadyForDispatch, color: '#6D28D9', icon: '', bg: '#EDE9FE' },
    { title: 'Completed Orders', value: metrics.completedOrders, color: '#15803D', icon: '', bg: '#DCFCE7' },
    { title: 'Cancelled Orders', value: metrics.cancelledOrders, color: '#B91C1C', icon: '', bg: '#FEE2E2' },
    { title: 'Low Stock SKU', value: metrics.lowStockProducts, color: '#C2410C', icon: '', bg: '#FFEDD5' },
    { title: 'Out of Stock SKU', value: metrics.outOfStockProducts, color: '#991B1B', icon: '', bg: '#FEE2E2' },
    { title: 'Total Catalog Products', value: metrics.totalProducts, color: '#374151', icon: '', bg: '#F3F4F6' },
    { title: "Today's Revenue", value: `₹${metrics.todaysRevenue.toFixed(2)}`, color: '#0F3D21', icon: '', bg: '#DCFCE7' },
    { title: 'Average Order Value', value: `₹${metrics.averageOrderValue.toFixed(2)}`, color: '#1E40AF', icon: '', bg: '#DBEAFE' },
    { title: 'Pending Actions', value: metrics.pendingActionsCount, color: '#9A3412', icon: '', bg: '#FFEDD5' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      {/* Top Banner & Quick Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
            Darkstore Operational Dashboard
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
            Real-time quick-commerce picking, packing, dispatch, and inventory analytics for <strong>Indiranagar QuickHub</strong>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/darkstore-admin/picking"
            style={{
              backgroundColor: '#0F3D21',
              color: '#FFFFFF',
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span></span> Launch Picker Station
          </Link>
          <Link
            href="/darkstore-admin/dispatch"
            style={{
              backgroundColor: '#F59E0B',
              color: '#0F3D21',
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span></span> Dispatch Bay
          </Link>
        </div>
      </div>

      {/* 12 Executive KPI Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {kpiCards.map((card, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 16,
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase' }}>{card.title}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: card.color, marginTop: 4 }}>{card.value}</div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: card.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Live Order Queue Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F3D21', margin: 0 }}>
             Active Quick-Commerce Order Queue
          </h2>
          <Link href="/darkstore-admin/orders" style={{ fontSize: 13, fontWeight: 700, color: '#0F3D21', textDecoration: 'none' }}>
            View All Orders →
          </Link>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB', color: '#374151', fontWeight: 700 }}>
                <th style={{ padding: '12px 16px' }}>Order #</th>
                <th style={{ padding: '12px 16px' }}>Customer</th>
                <th style={{ padding: '12px 16px' }}>Address</th>
                <th style={{ padding: '12px 16px' }}>Priority</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Assigned Picker</th>
                <th style={{ padding: '12px 16px' }}>Amount</th>
                <th style={{ padding: '12px 16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F3D21' }}>{order.orderNumber}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#111827' }}>{order.customerName}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{order.customerPhone}</div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#4B5563', maxWidth: 220 }}>{order.deliveryAddress}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 800,
                        backgroundColor: order.priority === 'HIGH' ? '#FEE2E2' : '#E0F2FE',
                        color: order.priority === 'HIGH' ? '#991B1B' : '#0369A1',
                      }}
                    >
                      {order.priority}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 800,
                        backgroundColor: order.status === 'NEW' ? '#FEF3C7' : '#DBEAFE',
                        color: order.status === 'NEW' ? '#92400E' : '#1E40AF',
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#374151' }}>{order.assignedPicker || 'Unassigned'}</td>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: '#111827' }}>₹{order.totalAmount.toFixed(2)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <Link
                      href={`/darkstore-admin/picking?orderId=${order.id}`}
                      style={{
                        backgroundColor: '#0F3D21',
                        color: '#FFFFFF',
                        padding: '6px 12px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      Start Pick 
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
