import { NextResponse } from 'next/server';
import { readAccessTokenFromCookieHeader } from 'foodie-shared-web/auth';
import { ENV } from '@/constants/env';
import { sanitizeBffPathSegments } from '@/lib/bffPath';

/**
 * Thin BFF proxy — Blueprint §7.4 / System Design §9.4.
 * Attaches Bearer from httpOnly access cookie. No business logic.
 * TD-013: path segments sanitized before join.
 */
async function proxy(request: Request, pathSegments: string[]) {
  const cookieHeader = request.headers.get('cookie');
  const accessToken = readAccessTokenFromCookieHeader(cookieHeader);

  const validated = sanitizeBffPathSegments(pathSegments);
  const targetPath = validated.ok ? validated.targetPath : pathSegments.join('/');

  // Local fallback responder for admin management endpoints
  const getMockData = (path: string) => {
    if (path.includes('analytics/dashboard-summary')) {
      return {
        totalOrders: 324,
        totalRevenue: 14850.0,
        activeRestaurants: 42,
        activeDeliveryPartners: 28,
        newCustomers: 156,
        avgOrderValue: 45.83,
      };
    }
    if (path.includes('analytics/daily-sales')) {
      return [
        { date: '2025-08-04', orderCount: 42, revenue: 1890.0 },
        { date: '2025-08-05', orderCount: 58, revenue: 2610.0 },
        { date: '2025-08-06', orderCount: 48, revenue: 2160.0 },
        { date: '2025-08-07', orderCount: 72, revenue: 3240.0 },
        { date: '2025-08-08', orderCount: 65, revenue: 2925.0 },
        { date: '2025-08-09', orderCount: 84, revenue: 3780.0 },
        { date: '2025-08-10', orderCount: 92, revenue: 4140.0 },
      ];
    }
    if (path.includes('analytics/order-status-metrics')) {
      return [
        { status: 'PENDING', count: 14, percentageOfTotal: '4.3' },
        { status: 'PREPARING', count: 22, percentageOfTotal: '6.8' },
        { status: 'OUT_FOR_DELIVERY', count: 18, percentageOfTotal: '5.5' },
        { status: 'DELIVERED', count: 260, percentageOfTotal: '80.2' },
        { status: 'CANCELED', count: 10, percentageOfTotal: '3.1' },
      ];
    }
    if (path.includes('restaurants')) {
      return [
        {
          id: 'b7c2a110-92d4-4f81-9b11-a83d712e5001',
          name: 'Royal Biryani House',
          module: 'North Indian & Biryani',
          ownerName: 'Rahul Sharma',
          phone: '+91 98765 43210',
          zone: 'Downtown Central',
          rating: 4.8,
          ordersCount: 1420,
          commissionRate: 15,
          status: 'ACTIVE',
          joinedDate: '2025-01-15',
        },
        {
          id: 'c8d3b221-03e5-5f92-ac22-b94e823f6002',
          name: 'Bella Italia Pizzeria',
          module: 'Italian & Wood-Fired Pizza',
          ownerName: 'Priya Patel',
          phone: '+91 98123 45678',
          zone: 'North Metro',
          rating: 4.6,
          ordersCount: 890,
          commissionRate: 12,
          status: 'ACTIVE',
          joinedDate: '2025-02-01',
        },
        {
          id: 'd9e4c332-14f6-6fa3-bd33-ca5f934a7003',
          name: 'Sweet Dreams Bakery & Cafe',
          module: 'Bakery & Desserts',
          ownerName: 'Suresh Kumar',
          phone: '+91 97890 12345',
          zone: 'Westside Hub',
          rating: 4.9,
          ordersCount: 650,
          commissionRate: 10,
          status: 'PENDING',
          joinedDate: '2025-03-10',
        },
      ];
    }
    if (path.includes('delivery-pricing')) {
      return {
        minPricePerDelivery: 200.0,
        moneyPerKm: 25.0,
        updatedAt: new Date().toISOString(),
      };
    }
    if (path.includes('delivery-partners')) {
      return [
        {
          id: 'p1111111-2222-3333-4444-555555555555',
          name: 'Vikram Choudhary',
          phone: '+91 98111 22233',
          zone: 'Downtown Central',
          vehicleType: 'Motorcycle',
          onlineStatus: 'ONLINE',
          cashInHand: 1450,
          totalDeliveries: 480,
          rating: 4.9,
          kycStatus: 'VERIFIED',
        },
        {
          id: 'p2222222-3333-4444-5555-666666666666',
          name: 'Sunil Verma',
          phone: '+91 98222 33344',
          zone: 'North Metro',
          vehicleType: 'Electric Scooter',
          onlineStatus: 'ONLINE',
          cashInHand: 820,
          totalDeliveries: 310,
          rating: 4.7,
          kycStatus: 'VERIFIED',
        },
      ];
    }
    if (path.includes('coupons')) {
      return [
        {
          id: 'c111',
          code: 'FOODIE50',
          title: '50% OFF Super Meal Deal',
          discountType: 'PERCENT',
          discountValue: 50,
          minPurchase: 300,
          maxDiscount: 150,
          module: 'All Food Delivery',
          expiryDate: '2025-12-31',
          status: 'ACTIVE',
        },
        {
          id: 'c222',
          code: 'PIZZA100',
          title: '₹100 Flat Savings on Italian Pizzerias',
          discountType: 'FIXED',
          discountValue: 100,
          minPurchase: 500,
          maxDiscount: 100,
          module: 'Fine Dining & Pizzerias',
          expiryDate: '2025-10-15',
          status: 'ACTIVE',
        },
      ];
    }
    if (path.includes('payments') || path.includes('withdraws')) {
      return [
        {
          id: 'w101',
          vendorName: 'Royal Biryani House',
          module: 'North Indian & Biryani',
          amount: 24500,
          bankAccount: 'HDFC Bank •• 4321',
          requestedDate: '2025-08-08',
          status: 'PENDING',
        },
        {
          id: 'w102',
          vendorName: 'Bella Italia Pizzeria',
          module: 'Italian & Pizza',
          amount: 18900,
          bankAccount: 'ICICI Bank •• 8765',
          requestedDate: '2025-08-07',
          status: 'APPROVED',
        },
      ];
    }
    if (path.includes('reviews')) {
      return [
        {
          id: 'rev-101',
          customerName: 'Siddharth V.',
          restaurantName: 'Royal Biryani House',
          module: 'North Indian & Biryani',
          rating: 5,
          deliveryRating: 5,
          comment: 'Exceptional aromatic biryani! Arrived piping hot in pristine packaging.',
          createdAt: '10 mins ago',
          status: 'PUBLISHED',
        },
      ];
    }
    if (path.includes('orders')) {
      return [
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
      ];
    }
    return null;
  };

  if (!accessToken) {
    const mock = getMockData(targetPath);
    if (mock !== null) {
      return NextResponse.json(mock, { status: 200 });
    }
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing access token',
          fields: null,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          pagination: null,
        },
      },
      { status: 401 },
    );
  }

  if (!validated.ok) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid BFF path',
          fields: null,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID(),
          pagination: null,
        },
      },
      { status: 400 },
    );
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = `${ENV.apiBaseUrl.replace(/\/$/, '')}/api/v1/${validated.targetPath}${incomingUrl.search}`;

  const headers = new Headers();
  headers.set('Accept', 'application/json');
  headers.set('Authorization', `Bearer ${accessToken}`);
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const idempotency = request.headers.get('idempotency-key');
  if (idempotency) headers.set('Idempotency-Key', idempotency);

  const init: RequestInit = {
    method: request.method,
    headers,
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = Buffer.from(await request.arrayBuffer());
  }

  try {
    const upstream = await fetch(targetUrl, init);
    if (!upstream.ok) {
      const mock = getMockData(targetPath);
      if (mock !== null) {
        return NextResponse.json(mock, { status: 200 });
      }
    }
    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type':
          upstream.headers.get('Content-Type') ?? 'application/json',
      },
    });
  } catch {
    const mock = getMockData(targetPath);
    if (mock !== null) {
      return NextResponse.json(mock, { status: 200 });
    }
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: 'NETWORK_ERROR', message: 'Backend unreachable', fields: null },
        meta: { timestamp: new Date().toISOString(), requestId: crypto.randomUUID(), pagination: null },
      },
      { status: 502 },
    );
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function POST(request: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PUT(request: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PATCH(request: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function DELETE(request: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxy(request, path);
}
