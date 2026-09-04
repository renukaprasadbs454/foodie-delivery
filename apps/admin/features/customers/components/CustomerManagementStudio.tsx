'use client';

import React, { useState } from 'react';
import type { CustomerProfile, SupportTicket, AccountStatus, TicketStatus } from '../types/customerTypes';
import { calculateCustomerLtvBadge } from '../types/customerTypes';

const INITIAL_CUSTOMERS: CustomerProfile[] = [
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
  {
    id: 'CUST-8003',
    name: 'Elena Rostova',
    email: 'elena.rostova@example.com',
    phone: '+1 (555) 345-6789',
    totalOrders: 8,
    totalSpend: 240.25,
    savedAddressesCount: 1,
    accountStatus: 'ACTIVE',
    joinedDate: '2026-03-20',
    lastOrderDate: '2026-08-04',
    loyaltyTier: 'SILVER',
  },
  {
    id: 'CUST-8004',
    name: 'Arthur Pendelton',
    email: 'arthur.p@example.com',
    phone: '+1 (555) 456-7890',
    totalOrders: 3,
    totalSpend: 85.00,
    savedAddressesCount: 1,
    accountStatus: 'SUSPENDED',
    joinedDate: '2026-06-15',
    lastOrderDate: '2026-07-22',
    loyaltyTier: 'BRONZE',
  },
];

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-401',
    customerId: 'CUST-8002',
    customerName: 'Marcus Vance',
    customerEmail: 'marcus.vance@example.com',
    orderId: 'ORD-9821',
    subject: 'Missing extra cheese pizza topping',
    category: 'MISSING_ITEM',
    status: 'OPEN',
    priority: 'HIGH',
    createdAt: '2026-08-11 12:15',
    updatedAt: '2026-08-11 12:15',
    agentNotes: 'Customer reported missing topping on Artisan Pizza order.',
  },
  {
    id: 'TCK-402',
    customerId: 'CUST-8003',
    customerName: 'Elena Rostova',
    customerEmail: 'elena.rostova@example.com',
    orderId: 'ORD-9740',
    subject: 'Driver delayed by 25 mins due to rain',
    category: 'DELIVERY_DELAY',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    createdAt: '2026-08-11 11:30',
    updatedAt: '2026-08-11 12:00',
    agentNotes: 'Issued $5.00 wallet compensation credit.',
  },
  {
    id: 'TCK-403',
    customerId: 'CUST-8001',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@example.com',
    orderId: 'ORD-9610',
    subject: 'Incorrect drink size delivered',
    category: 'OTHER',
    status: 'RESOLVED',
    priority: 'LOW',
    createdAt: '2026-08-10 18:20',
    updatedAt: '2026-08-10 19:00',
    agentNotes: 'Refunded $2.50 to customer wallet.',
  },
];

export function CustomerManagementStudio() {
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'TICKETS'>('DIRECTORY');
  const [customers, setCustomers] = useState<CustomerProfile[]>(INITIAL_CUSTOMERS);
  const [tickets, setTickets] = useState<SupportTicket[]>(INITIAL_TICKETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Block Modal State
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const totalCustomers = customers.length;
  const activeCount = customers.filter((c) => c.accountStatus === 'ACTIVE').length;
  const suspendedCount = customers.filter((c) => c.accountStatus === 'SUSPENDED').length;
  const totalLtv = customers.reduce((acc, c) => acc + c.totalSpend, 0);
  const avgLtv = totalCustomers > 0 ? (totalLtv / totalCustomers).toFixed(2) : '0';

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && c.accountStatus === statusFilter;
  });

  const toggleAccountStatus = (id: string, newStatus: AccountStatus) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...c, accountStatus: newStatus } : c))
    );
    setToastMsg(`Account ${id} updated to ${newStatus}`);
    setTimeout(() => setToastMsg(null), 3000);
    setSelectedCustomer(null);
    setBlockReason('');
  };

  const updateTicketStatus = (ticketId: string, newStatus: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: newStatus, updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16) }
          : t
      )
    );
    setToastMsg(`Ticket ${ticketId} updated to ${newStatus}`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Alert */}
      {toastMsg ? (
        <div
          style={{
            backgroundColor: '#0F3D21',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            boxShadow: '0 8px 24px rgba(15,61,33,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{toastMsg}</span>
          <span style={{ fontSize: 12, color: '#F59E0B' }}>● Operations Live</span>
        </div>
      ) : null}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F3D21', margin: 0 }}>
             Customer Operations & Support Desk
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
            Manage customer profiles, account security block/unblock controls, and customer support tickets.
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', backgroundColor: '#E2E8F0', padding: 4, borderRadius: 10 }}>
          <button
            type="button"
            onClick={() => setActiveTab('DIRECTORY')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: activeTab === 'DIRECTORY' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'DIRECTORY' ? '#0F3D21' : '#64748B',
              boxShadow: activeTab === 'DIRECTORY' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
             Customer Directory ({totalCustomers})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TICKETS')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: activeTab === 'TICKETS' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'TICKETS' ? '#0F3D21' : '#64748B',
              boxShadow: activeTab === 'TICKETS' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
             Support Tickets ({tickets.filter((t) => t.status === 'OPEN').length} Open)
          </button>
        </div>
      </div>

      {/* Top Executive Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Registered</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0F3D21', marginTop: 4 }}>
            {totalCustomers}
          </div>
          <div style={{ fontSize: 12, color: '#166534', fontWeight: 600, marginTop: 6 }}>● Active Platform Users</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Accounts</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#166534', marginTop: 4 }}>
            {activeCount}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 6 }}>Verified & Unrestricted</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Suspended Accounts</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#DC2626', marginTop: 4 }}>
            {suspendedCount}
          </div>
          <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600, marginTop: 6 }}>Safety / Abuse Flagged</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Average Customer LTV</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#D97706', marginTop: 4 }}>
            ${avgLtv}
          </div>
          <div style={{ fontSize: 12, color: '#D97706', fontWeight: 600, marginTop: 6 }}>Lifetime value per customer</div>
        </div>
      </div>

      {/* TAB 1: CUSTOMER DIRECTORY */}
      {activeTab === 'DIRECTORY' ? (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20 }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
              <input
                type="text"
                placeholder="Search by name, email, or phone number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '9px 14px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  fontSize: 13,
                  maxWidth: 320,
                  width: '100%',
                }}
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600 }}
              >
                <option value="ALL">Filter: All Statuses</option>
                <option value="ACTIVE">● Active Only</option>
                <option value="SUSPENDED">○ Suspended Only</option>
              </select>
            </div>

            <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              Showing {filteredCustomers.length} customers
            </div>
          </div>

          {/* Directory Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Customer</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Contact</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Total Orders</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Total Spend</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>LTV Tier</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => {
                  const ltv = calculateCustomerLtvBadge(cust.totalSpend);

                  return (
                    <tr key={cust.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              backgroundColor: '#0F3D21',
                              color: '#F59E0B',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 14,
                            }}
                          >
                            {cust.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F3D21' }}>{cust.name}</div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>Joined: {cust.joinedDate}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <div style={{ color: '#334155', fontWeight: 600 }}>{cust.email}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{cust.phone}</div>
                      </td>

                      <td style={{ padding: '12px', fontWeight: 700, color: '#1E293B' }}>
                        {cust.totalOrders} orders
                      </td>

                      <td style={{ padding: '12px', fontWeight: 800, color: '#166534' }}>
                        ${cust.totalSpend.toFixed(2)}
                      </td>

                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            backgroundColor: ltv.bg,
                            color: ltv.color,
                          }}
                        >
                          {ltv.tier}
                        </span>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 20,
                            backgroundColor: cust.accountStatus === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2',
                            color: cust.accountStatus === 'ACTIVE' ? '#166534' : '#DC2626',
                          }}
                        >
                          {cust.accountStatus === 'ACTIVE' ? '● Active' : '○ Suspended'}
                        </span>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(cust)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            backgroundColor: cust.accountStatus === 'ACTIVE' ? '#FFF1F2' : '#F0FDF4',
                            color: cust.accountStatus === 'ACTIVE' ? '#991B1B' : '#166534',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {cust.accountStatus === 'ACTIVE' ? ' Suspend' : ' Re-activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: SUPPORT TICKETS DESK */
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1E293B', margin: '0 0 16px' }}>
             Active Customer Support & Dispute Tickets
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Ticket ID</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Customer</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Order</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Category & Subject</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Priority</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((tck) => (
                  <tr key={tck.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px', fontWeight: 800, color: '#0F3D21' }}>{tck.id}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#1E293B' }}>{tck.customerName}</div>
                      <div style={{ fontSize: 11, color: '#64748B' }}>{tck.customerEmail}</div>
                    </td>
                    <td style={{ padding: '12px', fontWeight: 700, color: '#2563EB' }}>{tck.orderId}</td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: 4,
                          backgroundColor: '#E0E7FF',
                          color: '#3730A3',
                          marginRight: 6,
                        }}
                      >
                        {tck.category}
                      </span>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{tck.subject}</span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: tck.priority === 'HIGH' ? '#DC2626' : tck.priority === 'MEDIUM' ? '#D97706' : '#64748B',
                        }}
                      >
                        {tck.priority}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <select
                        value={tck.status}
                        onChange={(e) => updateTicketStatus(tck.id, e.target.value as TicketStatus)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: '1px solid #CBD5E1',
                          fontSize: 11,
                          fontWeight: 700,
                          backgroundColor: tck.status === 'RESOLVED' ? '#DCFCE7' : tck.status === 'OPEN' ? '#FEF3C7' : '#FFFFFF',
                          color: tck.status === 'RESOLVED' ? '#166534' : tck.status === 'OPEN' ? '#D97706' : '#334155',
                        }}
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CLOSED">CLOSED</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px', fontSize: 12, color: '#64748B' }}>{tck.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Account Block Modal */}
      {selectedCustomer ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15,23,42,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 24,
              maxWidth: 440,
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F3D21', margin: 0 }}>
                {selectedCustomer.accountStatus === 'ACTIVE' ? ' Suspend Account' : ' Re-activate Account'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }}
              >
                
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
              You are updating account status for <strong>{selectedCustomer.name}</strong> ({selectedCustomer.email}).
            </p>

            {selectedCustomer.accountStatus === 'ACTIVE' ? (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Suspension Reason (Audit Log)
                </label>
                <textarea
                  rows={3}
                  placeholder="State reason for security audit..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  toggleAccountStatus(
                    selectedCustomer.id,
                    selectedCustomer.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
                  )
                }
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: selectedCustomer.accountStatus === 'ACTIVE' ? '#DC2626' : '#166534',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Confirm {selectedCustomer.accountStatus === 'ACTIVE' ? 'Suspension' : 'Activation'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
