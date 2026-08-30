import { GET } from '../app/api/bff/[...path]/route';

describe('Dashboard Backend BFF API', () => {
  it('returns dashboard summary data correctly', async () => {
    const req = new Request('http://localhost:3000/api/bff/analytics/dashboard-summary');
    const res = await GET(req, { params: Promise.resolve({ path: ['analytics', 'dashboard-summary'] }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.totalOrders).toBe(324);
    expect(data.totalRevenue).toBe(14850.0);
    expect(data.activeRestaurants).toBe(42);
    expect(data.activeDeliveryPartners).toBe(28);
  });

  it('returns daily sales metrics data for chart', async () => {
    const req = new Request('http://localhost:3000/api/bff/analytics/daily-sales');
    const res = await GET(req, { params: Promise.resolve({ path: ['analytics', 'daily-sales'] }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('date');
    expect(data[0]).toHaveProperty('orderCount');
    expect(data[0]).toHaveProperty('revenue');
  });

  it('returns order status breakdown metrics', async () => {
    const req = new Request('http://localhost:3000/api/bff/analytics/order-status-metrics');
    const res = await GET(req, { params: Promise.resolve({ path: ['analytics', 'order-status-metrics'] }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((m: { status: string }) => m.status === 'DELIVERED')).toBe(true);
  });

  it('returns food restaurants directory for dashboard management', async () => {
    const req = new Request('http://localhost:3000/api/bff/restaurants');
    const res = await GET(req, { params: Promise.resolve({ path: ['restaurants'] }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.some((r: { name: string }) => r.name === 'Royal Biryani House')).toBe(true);
  });
});
