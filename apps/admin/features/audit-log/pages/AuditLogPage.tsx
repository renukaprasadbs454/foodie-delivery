'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Text, trackAnalyticsEvent, useTheme, EmptyState } from 'foodie-shared-web';
import { useAppSelector } from '@/store/hooks';
import { selectAdminRole } from '@/features/auth/authSlice';
import { useGetAuditLogsQuery } from '@/api/endpoints/auditLogsApi';
import { MOCK_AUDIT_LOGS, type AuditLogRecord } from '../types';
import { AuditLogDetailModal } from '../components/AuditLogDetailModal';

export function AuditLogPage() {
  const { tokens } = useTheme();
  const role = useAppSelector(selectAdminRole);
  const isSuperAdmin = role === 'SUPER_ADMIN';

  // Filters State
  const [resourceType, setResourceType] = useState<string>('ALL');
  const [action, setAction] = useState<string>('ALL');
  const [resourceId, setResourceId] = useState<string>('');
  const [adminUserId, setAdminUserId] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');
  const [page, setPage] = useState<number>(0);
  const [pageSize] = useState<number>(10);

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLogRecord | null>(null);

  // Analytics view track
  useEffect(() => {
    trackAnalyticsEvent('admin_audit_logs_viewed');
  }, []);

  // RTK Query API fetch
  const {
    data: apiData,
    isLoading,
    isError,
    refetch,
  } = useGetAuditLogsQuery(
    {
      resourceType: resourceType === 'ALL' ? undefined : resourceType,
      action: action === 'ALL' ? undefined : action,
      resourceId: resourceId.trim() || undefined,
      adminUserId: adminUserId.trim() || undefined,
      createdAtFrom: dateFrom || undefined,
      createdAtTo: dateTo || undefined,
      page,
      size: pageSize,
      sort: sortOrder === 'NEWEST' ? 'createdAt,desc' : 'createdAt,asc',
    },
    {
      skip: !isSuperAdmin,
    }
  );

  // Filter mock logs locally if query fails or returns empty/unreachable
  const fallbackData = useMemo(() => {
    let logs = [...MOCK_AUDIT_LOGS];

    // Filter resource type
    if (resourceType !== 'ALL') {
      logs = logs.filter((log) => log.resourceType === resourceType);
    }

    // Filter action
    if (action !== 'ALL') {
      logs = logs.filter((log) => log.action === action);
    }

    // Filter resourceId
    if (resourceId.trim()) {
      logs = logs.filter((log) =>
        log.resourceId.toLowerCase().includes(resourceId.trim().toLowerCase())
      );
    }

    // Filter adminUserId
    if (adminUserId.trim()) {
      logs = logs.filter(
        (log) =>
          log.adminUserId.toLowerCase().includes(adminUserId.trim().toLowerCase()) ||
          (log.adminUserName &&
            log.adminUserName.toLowerCase().includes(adminUserId.trim().toLowerCase()))
      );
    }

    // Filter Date Range
    if (dateFrom) {
      const fromTime = new Date(dateFrom).getTime();
      logs = logs.filter((log) => new Date(log.createdAt).getTime() >= fromTime);
    }
    if (dateTo) {
      // Include the entire day of dateTo
      const toTime = new Date(`${dateTo}T23:59:59Z`).getTime();
      logs = logs.filter((log) => new Date(log.createdAt).getTime() <= toTime);
    }

    // Sorting
    logs.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'NEWEST' ? timeB - timeA : timeA - timeB;
    });

    // Pagination
    const totalElements = logs.length;
    const totalPages = Math.ceil(totalElements / pageSize);
    const startIndex = page * pageSize;
    const paginatedLogs = logs.slice(startIndex, startIndex + pageSize);

    return {
      content: paginatedLogs,
      totalElements,
      totalPages,
      pageNumber: page,
      last: page >= totalPages - 1,
    };
  }, [resourceType, action, resourceId, adminUserId, dateFrom, dateTo, sortOrder, page, pageSize]);

  // Determine active dataset
  const hasApiContent = apiData && apiData.content && apiData.content.length > 0;
  const useFallback = isError || !hasApiContent;
  const activeDataset = useFallback ? fallbackData : apiData!;
  const isDemoMode = useFallback && !isLoading;

  const handleClearFilters = () => {
    setResourceType('ALL');
    setAction('ALL');
    setResourceId('');
    setAdminUserId('');
    setDateFrom('');
    setDateTo('');
    setSortOrder('NEWEST');
    setPage(0);
  };

  const getActionBadgeStyle = (act: string) => {
    switch (act) {
      case 'APPROVE':
      case 'KYC_APPROVE':
        return { color: '#065F46', bg: '#D1FAE5' }; // Green
      case 'SUSPEND':
      case 'DEACTIVATE':
      case 'REFUND':
        return { color: '#991B1B', bg: '#FEE2E2' }; // Red
      case 'OVERRIDE_STATUS':
        return { color: '#92400E', bg: '#FEF3C7' }; // Yellow/Gold
      case 'CREATE':
        return { color: '#1E40AF', bg: '#DBEAFE' }; // Blue
      default:
        return { color: '#374151', bg: '#F3F4F6' }; // Gray
    }
  };

  if (!isSuperAdmin) {
    return (
      <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}>
        <EmptyState
          title="Permission Denied"
          description="You do not have administrative clearance to access the platform audit logs. SUPER_ADMIN privileges required."
          aria-label="unauthorized access error"
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Text as="h1" variant="heading1" color="#14532D" style={{ margin: 0 }}>
              System Audit Logs
            </Text>
            {isDemoMode ? (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#D97706',
                  backgroundColor: '#FEF3C7',
                  border: '1px solid rgba(217, 119, 6, 0.3)',
                  padding: '2px 8px',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    backgroundColor: '#D97706',
                    borderRadius: '50%',
                  }}
                />
                Demo Mode (API Unreachable)
              </span>
            ) : (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#059669',
                  backgroundColor: '#D1FAE5',
                  border: '1px solid rgba(5, 150, 105, 0.3)',
                  padding: '2px 8px',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 6,
                    height: 6,
                    backgroundColor: '#059669',
                    borderRadius: '50%',
                  }}
                />
                Live API Logs
              </span>
            )}
          </div>
          <Text as="p" variant="caption" color="#64748B" style={{ marginTop: 4 }}>
            Monitor and track administrative changes, vendor approvals, payment refunds, and fleet status updates.
          </Text>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#14532D',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
           Refresh
        </button>
      </div>

      {/* Filter Panel */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          padding: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {/* Admin User ID Search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Operator (UUID or Name)</label>
            <input
              type="text"
              value={adminUserId}
              onChange={(e) => {
                setAdminUserId(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name or UUID..."
              style={{
                padding: '10px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          {/* Resource ID Search */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Target Resource ID (UUID)</label>
            <input
              type="text"
              value={resourceId}
              onChange={(e) => {
                setResourceId(e.target.value);
                setPage(0);
              }}
              placeholder="Enter exact resource UUID..."
              style={{
                padding: '10px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          {/* Resource Type Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Resource Type</label>
            <select
              value={resourceType}
              onChange={(e) => {
                setResourceType(e.target.value);
                setPage(0);
              }}
              style={{
                padding: '10px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                fontSize: 13,
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="ALL">All Types</option>
              <option value="RESTAURANT">Restaurant</option>
              <option value="DELIVERY_PARTNER">Delivery Partner</option>
              <option value="ORDER">Order</option>
              <option value="PAYMENT">Payment</option>
              <option value="COUPON">Coupon</option>
            </select>
          </div>

          {/* Action Type Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Action Type</label>
            <select
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(0);
              }}
              style={{
                padding: '10px 12px',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                fontSize: 13,
                backgroundColor: '#FFFFFF',
              }}
            >
              <option value="ALL">All Actions</option>
              <option value="APPROVE">APPROVE</option>
              <option value="KYC_APPROVE">KYC_APPROVE</option>
              <option value="SUSPEND">SUSPEND</option>
              <option value="DEACTIVATE">DEACTIVATE</option>
              <option value="REFUND">REFUND</option>
              <option value="OVERRIDE_STATUS">OVERRIDE_STATUS</option>
              <option value="CREATE">CREATE</option>
            </select>
          </div>
        </div>

        {/* Date Ranges and Sorting */}
        <div
          style={{
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            paddingTop: 8,
            borderTop: '1px dashed #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {/* Created From */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Created From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #CBD5E1',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
            </div>

            {/* Created To */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Created To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #CBD5E1',
                  borderRadius: 8,
                  fontSize: 13,
                }}
              />
            </div>

            {/* Sort Order */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Sorting</label>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value as 'NEWEST' | 'OLDEST');
                  setPage(0);
                }}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #CBD5E1',
                  borderRadius: 8,
                  fontSize: 13,
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="NEWEST">Newest First</option>
                <option value="OLDEST">Oldest First</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearFilters}
            style={{
              padding: '10px 16px',
              backgroundColor: '#FAFAF7',
              color: '#14532D',
              border: '1px solid #CBD5E1',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs Table Area */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
            <span style={{ fontSize: 24, display: 'inline-block', animation: 'spin 1s linear infinite' }}>
              
            </span>
            <div style={{ marginTop: 8, fontWeight: 600 }}>Loading system audit logs...</div>
          </div>
        ) : activeDataset.content.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <EmptyState
              title="No Logs Found"
              description="No audit logs matched your search filters. Try clearing some parameters."
              aria-label="empty audit logs search results"
            />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#14532D', color: '#FFFFFF', fontSize: 13 }}>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>Action</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>Resource Type</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>Resource ID</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>Performed By</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>Timestamp</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700, textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {activeDataset.content.map((log) => {
                  const badge = getActionBadgeStyle(log.action);
                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        fontSize: 13,
                        transition: 'background-color 0.15s',
                        color: '#334155',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#FAFAF7';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#FFFFFF';
                      }}
                    >
                      {/* Action Badge */}
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            color: badge.color,
                            backgroundColor: badge.bg,
                            textTransform: 'uppercase',
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Resource Type */}
                      <td style={{ padding: '14px 20px', fontWeight: 600 }}>{log.resourceType}</td>

                      {/* Target UUID */}
                      <td style={{ padding: '14px 20px' }}>
                        <code style={{ fontSize: 12, color: '#0F172A', fontFamily: 'monospace' }}>
                          {log.resourceId}
                        </code>
                      </td>

                      {/* Operator User */}
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ fontWeight: 600, color: '#1E293B' }}>
                          {log.adminUserName || 'System Operator'}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Role: {log.adminUserRole || 'N/A'}</div>
                      </td>

                      {/* Timestamp */}
                      <td style={{ padding: '14px 20px', color: '#475569' }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </td>

                      {/* Details Trigger */}
                      <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#FEF3C7',
                            color: '#14532D',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#F59E0B';
                            e.currentTarget.style.color = '#FFFFFF';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FEF3C7';
                            e.currentTarget.style.color = '#14532D';
                          }}
                        >
                           State Diff
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {activeDataset.totalPages > 1 && (
          <div
            style={{
              padding: '16px 20px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FAFAF7',
            }}
          >
            <span style={{ fontSize: 13, color: '#64748B' }}>
              Showing Page <strong>{page + 1}</strong> of <strong>{activeDataset.totalPages}</strong> ({activeDataset.totalElements} records)
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#FFFFFF',
                  color: page === 0 ? '#CBD5E1' : '#14532D',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: page === 0 ? 'default' : 'pointer',
                }}
              >
                ◀ Previous
              </button>
              <button
                type="button"
                disabled={activeDataset.last}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#FFFFFF',
                  color: activeDataset.last ? '#CBD5E1' : '#14532D',
                  border: '1px solid #CBD5E1',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: activeDataset.last ? 'default' : 'pointer',
                }}
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>

      {/* State Diff Modal */}
      {selectedLog && (
        <AuditLogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
