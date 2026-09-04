'use client';

import React, { useState } from 'react';
import { Text } from 'foodie-shared-web';
import {
  useGetPendingApplicationsQuery,
  useGetApplicationDetailQuery,
  useVerifyDocumentMutation,
  useRequestChangesMutation,
  useApproveRestaurantMutation,
  useRejectRestaurantMutation,
  RestaurantApplicationDetail,
} from '@/api/endpoints/restaurantsApi';

export function RestaurantApprovalsStudio() {
  const [activeTab, setActiveTab] = useState<'PENDING_ADMIN_APPROVAL' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING_ADMIN_APPROVAL');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Rejection / Change Request State
  const [feedbackReason, setFeedbackReason] = useState('');
  const [modalAction, setModalAction] = useState<'REQUEST_CHANGES' | 'REJECT' | null>(null);
  const [docRejectTarget, setDocRejectTarget] = useState<'FSSAI' | 'GST' | 'PAN' | null>(null);
  const [docRejectReason, setDocRejectReason] = useState('');

  const { data: applicationsData, isLoading, refetch } = useGetPendingApplicationsQuery({
    status: activeTab === 'ALL' ? undefined : activeTab,
    page: 0,
    size: 50,
  });

  const { data: detailData, isLoading: isDetailLoading } = useGetApplicationDetailQuery(
    selectedAppId ?? '',
    { skip: !selectedAppId }
  );

  const [verifyDocument] = useVerifyDocumentMutation();
  const [requestChanges] = useRequestChangesMutation();
  const [approveRestaurant] = useApproveRestaurantMutation();
  const [rejectRestaurant] = useRejectRestaurantMutation();

  const handleDocVerify = async (docType: 'FSSAI' | 'GST' | 'PAN', status: 'VERIFIED' | 'REJECTED', reason?: string) => {
    if (!selectedAppId) return;
    try {
      await verifyDocument({
        restaurantId: selectedAppId,
        docType,
        status,
        reason,
      }).unwrap();
      setDocRejectTarget(null);
      setDocRejectReason('');
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to verify document.');
    }
  };

  const handleFinalApprove = async () => {
    if (!selectedAppId) return;
    if (!confirm('Are you sure you want to give final approval to activate this restaurant?')) return;
    try {
      await approveRestaurant(selectedAppId).unwrap();
      alert(' Restaurant has been approved and activated!');
      setSelectedAppId(null);
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to approve restaurant.');
    }
  };

  const handleActionSubmit = async () => {
    if (!selectedAppId || !feedbackReason.trim()) {
      alert('Please provide a reason/comments for this action.');
      return;
    }
    try {
      if (modalAction === 'REQUEST_CHANGES') {
        await requestChanges({ restaurantId: selectedAppId, reason: feedbackReason.trim() }).unwrap();
        alert(' Change request sent to restaurant user!');
      } else if (modalAction === 'REJECT') {
        await rejectRestaurant({ restaurantId: selectedAppId, reason: feedbackReason.trim() }).unwrap();
        alert(' Restaurant application rejected.');
      }
      setModalAction(null);
      setFeedbackReason('');
      setSelectedAppId(null);
      refetch();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to submit action.');
    }
  };

  const items: any[] = (applicationsData as any)?.content || (applicationsData as any)?.items || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Text as="h1" variant="heading1" color="#14532D" style={{ fontSize: 'clamp(20px, 4vw, 28px)' }}>
            Restaurant Registration Approvals
          </Text>
          <Text as="p" variant="caption" color="#64748B" style={{ fontSize: 13, marginTop: 4 }}>
            Review submitted Basic Info, FSSAI/GST/PAN Documents, and Brand Assets before final activation.
          </Text>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', backgroundColor: '#FFFFFF', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0' }}>
        {[
          { key: 'PENDING_ADMIN_APPROVAL', label: 'Pending Review' },
          { key: 'CHANGES_REQUESTED', label: 'Changes Requested' },
          { key: 'APPROVED', label: 'Approved' },
          { key: 'REJECTED', label: 'Rejected' },
          { key: 'ALL', label: 'All Applications' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: activeTab === tab.key ? '#14532D' : '#F1F5F9',
              color: activeTab === tab.key ? '#F59E0B' : '#475569',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications Data Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 880, borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#14532D', fontWeight: 700 }}>
              <th style={{ padding: '14px 20px' }}>Restaurant Info</th>
              <th style={{ padding: '14px 20px' }}>Owner Details</th>
              <th style={{ padding: '14px 20px' }}>Documents</th>
              <th style={{ padding: '14px 20px' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>
                  Loading applications...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>
                   No restaurant applications found for this filter.
                </td>
              </tr>
            ) : (
              items.map((app: any) => (
                <tr key={app.id || app.restaurantId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#14532D' }}>{app.name}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{app.address?.city || app.city || 'Location N/A'}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 600, color: '#334155' }}>{app.ownerName || 'Owner'}</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>{app.phone || app.email || 'No contact'}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {['FSSAI', 'GST', 'PAN'].map((type) => {
                        const doc = app.documents?.find((d: any) => d.docType === type);
                        const statusColor = doc?.status === 'VERIFIED' ? '#047857' : doc?.status === 'REJECTED' ? '#B91C1C' : '#D97706';
                        return (
                          <span
                            key={type}
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              backgroundColor: '#F1F5F9',
                              color: statusColor,
                              border: `1px solid ${statusColor}`,
                            }}
                          >
                            {type}: {doc ? doc.status : 'MISSING'}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor:
                          app.status === 'APPROVED'
                            ? '#D1FAE5'
                            : app.status === 'PENDING_ADMIN_APPROVAL'
                            ? '#FEF3C7'
                            : app.status === 'CHANGES_REQUESTED'
                            ? '#E0F2FE'
                            : '#FEE2E2',
                        color:
                          app.status === 'APPROVED'
                            ? '#047857'
                            : app.status === 'PENDING_ADMIN_APPROVAL'
                            ? '#B45309'
                            : app.status === 'CHANGES_REQUESTED'
                            ? '#0369A1'
                            : '#B91C1C',
                      }}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedAppId(app.restaurantId)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 6,
                        border: 'none',
                        backgroundColor: '#14532D',
                        color: '#F59E0B',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      Review Application
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Review Drawer / Modal */}
      {selectedAppId && detailData && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              width: 680,
              maxWidth: '100%',
              height: '100%',
              overflowY: 'auto',
              padding: '24px 28px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text as="h2" variant="heading2" color="#14532D" style={{ fontSize: 20 }}>
                  {detailData.name}
                </Text>
                <Text as="p" variant="caption" color="#64748B" style={{ fontSize: 12 }}>
                  Application ID: {detailData.restaurantId}
                </Text>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppId(null)}
                style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#64748B' }}
              >
                
              </button>
            </div>

            {/* Section 1: Basic Info Review */}
            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <Text as="h3" variant="heading3" color="#14532D" style={{ fontSize: 15, marginBottom: 12 }}>
                1. Basic Info & Owner Details
              </Text>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div><strong>Owner Name:</strong> {detailData.ownerName || 'N/A'}</div>
                <div><strong>Contact Phone:</strong> {detailData.phone || 'N/A'}</div>
                <div><strong>Email:</strong> {detailData.email || 'N/A'}</div>
                <div><strong>Commission Rate:</strong> {detailData.commissionPct || 18}%</div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <strong>Formatted Address:</strong> {detailData.address?.formattedAddress || detailData.address?.line1 || 'N/A'}
                </div>
              </div>
            </div>

            {/* Section 2: Legal & License Details */}
            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <Text as="h3" variant="heading3" color="#14532D" style={{ fontSize: 15, marginBottom: 12 }}>
                2. Legal & Registration Details
              </Text>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div><strong>Legal Name:</strong> {detailData.legalName || 'N/A'}</div>
                <div><strong>FSSAI License:</strong> {detailData.fssaiLicenseNumber || 'N/A'}</div>
                <div><strong>GSTIN:</strong> {detailData.gstin || 'N/A'}</div>
                <div><strong>PAN Number:</strong> {detailData.panNumber || 'N/A'}</div>
              </div>
            </div>

            {/* Section 3: Document Verification */}
            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <Text as="h3" variant="heading3" color="#14532D" style={{ fontSize: 15, marginBottom: 12 }}>
                3. Required Documents Review (FSSAI, GST, PAN)
              </Text>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {(['FSSAI', 'GST', 'PAN'] as const).map((docType) => {
                  const doc = detailData.documents?.find((d: any) => d.docType === docType);
                  return (
                    <div
                      key={docType}
                      style={{
                        backgroundColor: '#FFFFFF',
                        padding: 14,
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>
                           {docType} Certificate
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: doc?.status === 'VERIFIED' ? '#047857' : doc?.status === 'REJECTED' ? '#B91C1C' : '#D97706',
                          }}
                        >
                          {doc ? doc.status : 'NOT UPLOADED'}
                        </span>
                      </div>

                      {doc?.documentUrl && (
                        <a
                          href={doc.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#2563EB', fontSize: 13, textDecoration: 'underline' }}
                        >
                           Click here to view uploaded {docType} document
                        </a>
                      )}

                      {doc?.rejectionReason && (
                        <div style={{ fontSize: 12, color: '#DC2626', backgroundColor: '#FEE2E2', padding: 8, borderRadius: 6 }}>
                           Rejection Reason: {doc.rejectionReason}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => handleDocVerify(docType, 'VERIFIED')}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#16A34A',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                           Approve {docType}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocRejectTarget(docType)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#DC2626',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 6,
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                           Reject {docType}
                        </button>
                      </div>

                      {docRejectTarget === docType && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                          <input
                            type="text"
                            placeholder={`Reason for rejecting ${docType}...`}
                            value={docRejectReason}
                            onChange={(e) => setDocRejectReason(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 13 }}
                          />
                          <button
                            type="button"
                            onClick={() => handleDocVerify(docType, 'REJECTED', docRejectReason)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#991B1B',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: 6,
                              fontWeight: 700,
                              fontSize: 12,
                              cursor: 'pointer',
                              alignSelf: 'flex-start',
                            }}
                          >
                            Confirm {docType} Rejection
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: Brand Images Review */}
            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <Text as="h3" variant="heading3" color="#14532D" style={{ fontSize: 15, marginBottom: 12 }}>
                4. Brand Logo & Cover Photo Review
              </Text>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <Text as="p" variant="caption" style={{ fontWeight: 700, marginBottom: 6 }}>
                    Brand Logo
                  </Text>
                  {detailData.logoImageUrl ? (
                    <img src={detailData.logoImageUrl} alt="Logo" style={{ width: 100, height: 100, borderRadius: 12, objectFit: 'cover', border: '1px solid #CBD5E1' }} />
                  ) : (
                    <div style={{ padding: 20, backgroundColor: '#E2E8F0', borderRadius: 8, fontSize: 12, color: '#64748B' }}>No logo uploaded</div>
                  )}
                </div>
                <div>
                  <Text as="p" variant="caption" style={{ fontWeight: 700, marginBottom: 6 }}>
                    Cover Photo
                  </Text>
                  {detailData.coverImageUrl ? (
                    <img src={detailData.coverImageUrl} alt="Cover" style={{ width: '100%', height: 100, borderRadius: 12, objectFit: 'cover', border: '1px solid #CBD5E1' }} />
                  ) : (
                    <div style={{ padding: 20, backgroundColor: '#E2E8F0', borderRadius: 8, fontSize: 12, color: '#64748B' }}>No cover uploaded</div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 5: Final Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                onClick={handleFinalApprove}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#14532D',
                  color: '#F59E0B',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 800,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(20,83,45,0.2)',
                }}
              >
                 APPROVE RESTAURANT & ACTIVATE
              </button>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setModalAction('REQUEST_CHANGES')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#E0F2FE',
                    color: '#0369A1',
                    border: '1px solid #0284C7',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                   Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => setModalAction('REJECT')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    backgroundColor: '#FEE2E2',
                    color: '#991B1B',
                    border: '1px solid #DC2626',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                   Reject Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Reason Modal */}
      {modalAction && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: 24,
              borderRadius: 16,
              width: 480,
              maxWidth: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <Text as="h3" variant="heading3" color="#14532D">
              {modalAction === 'REQUEST_CHANGES' ? 'Request Registration Changes' : 'Reject Restaurant Application'}
            </Text>

            <p style={{ fontSize: 13, color: '#64748B' }}>
              {modalAction === 'REQUEST_CHANGES'
                ? 'Specify the exact corrections or missing details required from the restaurant owner.'
                : 'Provide the official reason for rejecting this restaurant application.'}
            </p>

            <textarea
              rows={4}
              placeholder="Enter detailed reasons / comments..."
              value={feedbackReason}
              onChange={(e) => setFeedbackReason(e.target.value)}
              style={{
                width: '100%',
                padding: 12,
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => setModalAction(null)}
                style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionSubmit}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: modalAction === 'REQUEST_CHANGES' ? '#0284C7' : '#DC2626',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
