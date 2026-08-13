import React, { Suspense } from 'react';
import { OrdersPage } from '@/features/orders/pages/OrdersPage';

/** AdminOrders — GAP-API-16 Partial (P2-ADM-04). */
export default function AdminOrdersRoute() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: '#14532D', fontWeight: 700 }}>Loading Order Book...</div>}>
      <OrdersPage />
    </Suspense>
  );
}

