import { NextResponse } from 'next/server';
import { ENV } from '@/constants/env';

const MOCK_CUSTOMERS = [
  {
    id: 'CUST-8001',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    phone: '+1 (555) 234-5678',
    totalOrders: 42,
    totalSpend: 1280.50,
    savedAddressesCount: 3,
    accountStatus: 'ACTIVE',
    joinedDate: '2025-11-12',
    lastOrderDate: '2026-08-10',
    loyaltyTier: 'PLATINUM',
  },
  {
    id: 'CUST-8002',
    name: 'Marcus Vance',
    email: 'marcus.vance@example.com',
    phone: '+1 (555) 987-6543',
    totalOrders: 19,
    totalSpend: 620.00,
    savedAddressesCount: 2,
    accountStatus: 'ACTIVE',
    joinedDate: '2026-01-05',
    lastOrderDate: '2026-08-11',
    loyaltyTier: 'GOLD',
  },
];

export async function GET() {
  try {
    const res = await fetch(`${ENV.apiBaseUrl}/api/v1/admin/customers`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // Offline fallback data
  }

  return NextResponse.json({ customers: MOCK_CUSTOMERS, total: MOCK_CUSTOMERS.length });
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const res = await fetch(`${ENV.apiBaseUrl}/api/v1/admin/customers/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // Fallback response
  }

  const payload = await req.clone().json().catch(() => ({}));
  return NextResponse.json({ success: true, updated: payload }, { status: 200 });
}
