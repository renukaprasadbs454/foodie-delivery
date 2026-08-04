/**
 * P2-ADM-02 analytics shapes — API Analytics DTOs §14.1–§14.3 /
 * DashboardSummaryResponseDto, DailySalesPointDto, OrderStatusMetricDto.
 */

export type AnalyticsDateRange = {
  dateFrom: string;
  dateTo: string;
};

export type DashboardSummary = {
  totalOrders: number;
  totalRevenue: number | string;
  activeRestaurants: number;
  activeDeliveryPartners: number;
  newCustomers: number;
  avgOrderValue: number | string;
};

export type DailySalesPoint = {
  date: string;
  orderCount: number;
  revenue: number | string;
};

export type OrderStatusMetric = {
  status: string;
  count: number;
  percentageOfTotal: number | string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime());
}

export function validateDateRange(
  dateFrom: string,
  dateTo: string,
): { ok: true; range: AnalyticsDateRange } | { ok: false; message: string } {
  if (!dateFrom || !dateTo) {
    return { ok: false, message: 'dateFrom and dateTo are required.' };
  }
  if (!isIsoDate(dateFrom) || !isIsoDate(dateTo)) {
    return { ok: false, message: 'Use ISO dates (YYYY-MM-DD).' };
  }
  if (dateFrom > dateTo) {
    return { ok: false, message: 'dateFrom must be on or before dateTo.' };
  }
  return { ok: true, range: { dateFrom, dateTo } };
}

/** Default range: last 7 calendar days inclusive (UTC ISO dates). */
export function defaultDateRange(now = new Date()): AnalyticsDateRange {
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 6);
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  };
}

export function formatMoneyInr(value: number | string | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '₹—';
  return `₹${n.toFixed(2)}`;
}

export function formatCount(value: number | string | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  return String(Math.trunc(n));
}

export function formatPercent(value: number | string | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(2)}%`;
}
