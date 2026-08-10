'use client';

import React, { useEffect } from 'react';
import { Text, useTheme } from 'foodie-shared-web';
import type { AuditLogRecord } from '../types';

interface Props {
  log: AuditLogRecord;
  onClose: () => void;
}

export function AuditLogDetailModal({ log, onClose }: Props) {
  const { tokens } = useTheme();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Extract all property names
  const before = log.beforeState || {};
  const after = log.afterState || {};
  const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();

  const getDiffStatus = (key: string) => {
    const hasBefore = key in before;
    const hasAfter = key in after;
    if (hasBefore && !hasAfter) return 'DELETED';
    if (!hasBefore && hasAfter) return 'ADDED';
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) return 'MODIFIED';
    return 'UNCHANGED';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          width: '100%',
          maxWidth: 800,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          animation: 'modalFadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#14532D',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        >
          <div>
            <h3 id="modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>
              Audit Log Details
            </h3>
            <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>
              ID: {log.id}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 24,
              color: '#FFFFFF',
              cursor: 'pointer',
              lineHeight: 1,
              padding: 4,
            }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Metadata Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              backgroundColor: '#FAFAF7',
              padding: 16,
              borderRadius: 12,
              border: '1px solid #E2E8F0',
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Operator</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginTop: 2 }}>
                {log.adminUserName || 'System'} ({log.adminUserRole || 'N/A'})
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Action</div>
              <div
                style={{
                  display: 'inline-block',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#14532D',
                  backgroundColor: '#FEF3C7',
                  padding: '2px 8px',
                  borderRadius: 4,
                  marginTop: 4,
                }}
              >
                {log.action}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Target Entity</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', marginTop: 2 }}>
                {log.resourceType}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Timestamp</div>
              <div style={{ fontSize: 14, color: '#1E293B', marginTop: 2 }}>
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Target ID banner */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Target ID</span>
            <code
              style={{
                backgroundColor: '#F8FAFC',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #E2E8F0',
                fontSize: 13,
                wordBreak: 'break-all',
                color: '#0F172A',
              }}
            >
              {log.resourceId}
            </code>
          </div>

          {/* Before & After State Changes */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#14532D', marginBottom: 12 }}>
              State Changes Comparison
            </div>

            {allKeys.length === 0 ? (
              <div style={{ color: '#64748B', fontSize: 14, fontStyle: 'italic', textAlign: 'center', padding: 24 }}>
                No state parameters recorded for this operation.
              </div>
            ) : (
              <div
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                {/* Table Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '150px 1fr 1fr',
                    backgroundColor: '#F8FAFC',
                    borderBottom: '1px solid #E2E8F0',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#475569',
                    padding: '10px 16px',
                  }}
                >
                  <div>Property</div>
                  <div>Before State</div>
                  <div>After State</div>
                </div>

                {/* Table Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 300, overflowY: 'auto' }}>
                  {allKeys.map((key) => {
                    const status = getDiffStatus(key);
                    const beforeVal = before[key] !== undefined ? JSON.stringify(before[key]) : '—';
                    const afterVal = after[key] !== undefined ? JSON.stringify(after[key]) : '—';

                    let rowBg = '#FFFFFF';
                    let valBeforeColor = '#334155';
                    let valAfterColor = '#334155';
                    let valAfterDecoration = 'none';

                    if (status === 'ADDED') {
                      rowBg = '#F0FDF4'; // Light green
                      valAfterColor = '#15803d';
                    } else if (status === 'DELETED') {
                      rowBg = '#FEF2F2'; // Light red
                      valBeforeColor = '#b91c1c';
                    } else if (status === 'MODIFIED') {
                      rowBg = '#FFFBEB'; // Light yellow
                      valBeforeColor = '#b91c1c';
                      valAfterColor = '#15803d';
                    }

                    return (
                      <div
                        key={key}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '150px 1fr 1fr',
                          borderBottom: '1px solid #F1F5F9',
                          fontSize: 13,
                          padding: '12px 16px',
                          backgroundColor: rowBg,
                          gap: 12,
                        }}
                      >
                        <div style={{ fontWeight: 600, color: '#334155', wordBreak: 'break-all' }}>
                          {key}
                        </div>
                        <div
                          style={{
                            color: valBeforeColor,
                            fontFamily: 'monospace',
                            fontSize: 12,
                            wordBreak: 'break-all',
                            textDecoration: status === 'MODIFIED' ? 'line-through' : 'none',
                          }}
                        >
                          {beforeVal}
                        </div>
                        <div
                          style={{
                            color: valAfterColor,
                            fontFamily: 'monospace',
                            fontSize: 12,
                            wordBreak: 'break-all',
                            fontWeight: status === 'MODIFIED' || status === 'ADDED' ? 600 : 'normal',
                          }}
                        >
                          {afterVal}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'flex-end',
            backgroundColor: '#FAFAF7',
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#64748B',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
