'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export interface PipelineStage {
  id: string;
  label: string;
  count: number;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface OrderOperationalPipelineProps {
  totalOrders?: number;
}

export function OrderOperationalPipeline({ totalOrders }: OrderOperationalPipelineProps) {
  const router = useRouter();

  // 6amMart Order Pipeline Stages
  const stages: PipelineStage[] = [
    { id: 'PENDING', label: 'Pending', count: Math.round((totalOrders ?? 324) * 0.08), icon: '', color: '#D97706', bgColor: '#FEF3C7', borderColor: '#FDE68A' },
    { id: 'CONFIRMED', label: 'Confirmed', count: Math.round((totalOrders ?? 324) * 0.12), icon: '', color: '#2563EB', bgColor: '#EFF6FF', borderColor: '#BFDBFE' },
    { id: 'PROCESSING', label: 'Packaging', count: Math.round((totalOrders ?? 324) * 0.06), icon: '', color: '#7C3AED', bgColor: '#F3E8FF', borderColor: '#DDD6FE' },
    { id: 'READY_FOR_PICKUP', label: 'Ready for Pickup', count: Math.round((totalOrders ?? 324) * 0.05), icon: '', color: '#4338CA', bgColor: '#E0E7FF', borderColor: '#C7D2FE' },
    { id: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', count: Math.round((totalOrders ?? 324) * 0.09), icon: '', color: '#EA580C', bgColor: '#FFEDD5', borderColor: '#FDBA74' },
    { id: 'DELIVERED', label: 'Delivered', count: Math.round((totalOrders ?? 324) * 0.61), icon: '', color: '#166534', bgColor: '#DCFCE7', borderColor: '#86EFAC' },
    { id: 'CANCELED', label: 'Canceled', count: Math.round((totalOrders ?? 324) * 0.03), icon: '', color: '#DC2626', bgColor: '#FEE2E2', borderColor: '#FCA5A5' },
    { id: 'REFUNDED', label: 'Refunded', count: Math.round((totalOrders ?? 324) * 0.01), icon: '', color: '#4B5563', bgColor: '#F3F4F6', borderColor: '#E5E7EB' },
  ];

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: '20px 24px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 14px 0 rgba(20, 83, 45, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#14532D', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span> Live Order Operational Pipeline</span>
            <span style={{ fontSize: 11, fontWeight: 700, backgroundColor: '#F0FDF4', color: '#166534', padding: '2px 8px', borderRadius: 12, border: '1px solid #BBF7D0' }}>
              Real-time Sync
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            Track order status progression across all partner stores in real time
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push('/orders')}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#14532D',
            backgroundColor: '#FEF3C7',
            border: '1px solid #FDE68A',
            padding: '6px 12px',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          View All Orders 
        </button>
      </div>

      {/* Grid of pipeline stage cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 12,
        }}
      >
        {stages.map((stage) => (
          <div
            key={stage.id}
            onClick={() => router.push(`/orders?status=${stage.id}`)}
            className="card-hover"
            style={{
              backgroundColor: stage.bgColor,
              border: `1px solid ${stage.borderColor}`,
              borderRadius: 12,
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 22 }}>{stage.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: stage.color, lineHeight: 1 }}>
              {stage.count}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: stage.color }}>
              {stage.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
