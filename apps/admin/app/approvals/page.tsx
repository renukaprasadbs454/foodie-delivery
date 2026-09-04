'use client';

import React, { useEffect, useState } from 'react';
import { HasPermission } from '@/components/HasPermission';

interface ApprovalRequest {
  id: string;
  actionType: string;
  resourceType: string;
  resourceId: string;
  status: string;
  reason?: string;
  payload?: string;
  requestedBy?: { fullName: string };
  createdAt: string;
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadPending() {
    try {
      const token = localStorage.getItem('foodie_admin_token') || sessionStorage.getItem('foodie_admin_token');
      const res = await fetch('/api/bff/admin/approvals', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const body = await res.json();
        const list = body.data || body;
        setRequests(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to fetch approval requests', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPending();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const token = localStorage.getItem('foodie_admin_token') || sessionStorage.getItem('foodie_admin_token');
      const res = await fetch(`/api/bff/admin/approvals/${id}/${action}`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        void loadPending();
      }
    } catch (err) {
      console.error(`Failed to ${action} request`, err);
    }
  };

  return (
    <HasPermission
      permission="settlement.release"
      fallback={
        <div style={{ padding: 24, color: '#DC2626', fontWeight: 600 }}>
          403 Forbidden — You do not have permission to view or manage high-risk action approvals.
        </div>
      }
    >
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>
            High-Risk Action Approvals
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>
            Review pending settlement releases, manual ledger adjustments, and financial mutation requests.
          </p>
        </div>

        {loading ? (
          <div>Loading requests…</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 32, backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', textAlign: 'center', color: '#64748B' }}>
             No pending high-risk approval requests!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.map((req) => (
              <div
                key={req.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 20,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 6, backgroundColor: '#FEF3C7', color: '#D97706' }}>
                      {req.actionType}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                      Resource: {req.resourceType} ({req.resourceId})
                    </span>
                  </div>
                  {req.reason ? (
                    <div style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>Reason: {req.reason}</div>
                  ) : null}
                  <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                    Requested by: {req.requestedBy?.fullName || 'Admin'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => void handleAction(req.id, 'approve')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: '#16A34A',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => void handleAction(req.id, 'reject')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: '#DC2626',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </HasPermission>
  );
}
