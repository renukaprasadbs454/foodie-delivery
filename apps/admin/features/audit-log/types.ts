export interface AuditLogRecord {
  id: string;
  adminUserId: string;
  adminUserName?: string;
  adminUserRole?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  content: AuditLogRecord[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export const MOCK_AUDIT_LOGS: AuditLogRecord[] = [
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    adminUserId: 'u0000000-0000-0000-0000-000000000001',
    adminUserName: 'Rahul Sharma',
    adminUserRole: 'SUPER_ADMIN',
    action: 'APPROVE',
    resourceType: 'RESTAURANT',
    resourceId: 'b7c2a110-92d4-4f81-9b11-a83d712e5001',
    beforeState: {
      restaurantId: 'b7c2a110-92d4-4f81-9b11-a83d712e5001',
      name: 'Royal Biryani House',
      status: 'PENDING',
      commissionPct: 15.0,
    },
    afterState: {
      restaurantId: 'b7c2a110-92d4-4f81-9b11-a83d712e5001',
      name: 'Royal Biryani House',
      status: 'ACTIVE',
      commissionPct: 15.0,
    },
    createdAt: '2026-08-03T10:15:30Z',
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    adminUserId: 'u0000000-0000-0000-0000-000000000002',
    adminUserName: 'Priya Patel',
    adminUserRole: 'OPS',
    action: 'SUSPEND',
    resourceType: 'RESTAURANT',
    resourceId: 'e0f5d443-25a7-70b4-ce44-db6a045b8004',
    beforeState: {
      restaurantId: 'e0f5d443-25a7-70b4-ce44-db6a045b8004',
      name: 'The Gourmet Cafe & Grill',
      status: 'ACTIVE',
    },
    afterState: {
      restaurantId: 'e0f5d443-25a7-70b4-ce44-db6a045b8004',
      name: 'The Gourmet Cafe & Grill',
      status: 'SUSPENDED',
      suspendReason: 'Violated customer service SLA agreements repeatedly.',
    },
    createdAt: '2026-08-03T14:45:00Z',
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    adminUserId: 'u0000000-0000-0000-0000-000000000001',
    adminUserName: 'Rahul Sharma',
    adminUserRole: 'SUPER_ADMIN',
    action: 'KYC_APPROVE',
    resourceType: 'DELIVERY_PARTNER',
    resourceId: 'f1a6e554-36b8-81c5-df55-ec7b156c9005',
    beforeState: {
      partnerId: 'f1a6e554-36b8-81c5-df55-ec7b156c9005',
      name: 'Amit Kumar',
      kycStatus: 'PENDING',
    },
    afterState: {
      partnerId: 'f1a6e554-36b8-81c5-df55-ec7b156c9005',
      name: 'Amit Kumar',
      kycStatus: 'VERIFIED',
      verifiedBy: 'u0000000-0000-0000-0000-000000000001',
    },
    createdAt: '2026-08-04T09:30:15Z',
  },
  {
    id: 'a4444444-4444-4444-4444-444444444444',
    adminUserId: 'u0000000-0000-0000-0000-000000000003',
    adminUserName: 'Vikram Singh',
    adminUserRole: 'FINANCE',
    action: 'REFUND',
    resourceType: 'PAYMENT',
    resourceId: 'p0f5d443-25a7-70b4-ce44-db6a045b8033',
    beforeState: {
      paymentId: 'p0f5d443-25a7-70b4-ce44-db6a045b8033',
      amount: 850.0,
      status: 'CAPTURED',
    },
    afterState: {
      paymentId: 'p0f5d443-25a7-70b4-ce44-db6a045b8033',
      amount: 850.0,
      status: 'REFUNDED',
      refundRequestId: 'ref_9081237',
      reason: 'Accidental double charge due to gateway timeout',
    },
    createdAt: '2026-08-04T12:00:00Z',
  },
  {
    id: 'a5555555-5555-5555-5555-555555555555',
    adminUserId: 'u0000000-0000-0000-0000-000000000002',
    adminUserName: 'Priya Patel',
    adminUserRole: 'OPS',
    action: 'OVERRIDE_STATUS',
    resourceType: 'ORDER',
    resourceId: 'o9e4c332-14f6-6fa3-bd33-ca5f934a7022',
    beforeState: {
      orderId: 'o9e4c332-14f6-6fa3-bd33-ca5f934a7022',
      orderNumber: 'ORD-45691',
      status: 'PREPARING',
    },
    afterState: {
      orderId: 'o9e4c332-14f6-6fa3-bd33-ca5f934a7022',
      orderNumber: 'ORD-45691',
      status: 'CANCELLED',
      overrideReason: 'Customer requested cancellation, store gas pipeline leak emergency',
    },
    createdAt: '2026-08-04T17:10:45Z',
  },
  {
    id: 'a6666666-6666-6666-6666-666666666666',
    adminUserId: 'u0000000-0000-0000-0000-000000000002',
    adminUserName: 'Priya Patel',
    adminUserRole: 'OPS',
    action: 'CREATE',
    resourceType: 'COUPON',
    resourceId: 'c5555555-5555-5555-5555-555555555555',
    beforeState: null,
    afterState: {
      couponId: 'c5555555-5555-5555-5555-555555555555',
      code: '6amFREE',
      discountType: 'PERCENT',
      discountValue: 100,
      maxDiscount: 100,
      status: 'ACTIVE',
    },
    createdAt: '2026-08-05T08:00:00Z',
  },
];
