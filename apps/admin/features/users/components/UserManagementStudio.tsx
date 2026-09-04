'use client';

import React, { useState } from 'react';
import type { AdminRole } from 'foodie-shared-web';
import type { AdminUser, UserAccountStatus } from '../types/usersTypes';
import { formatRoleBadge, formatStatusBadge } from '../types/usersTypes';

const INITIAL_USERS: AdminUser[] = [
  {
    id: 'USR-1001',
    fullName: 'Alex Vance',
    email: 'alex.vance@foodie.com',
    phone: '+1 (555) 019-2831',
    role: 'SUPER_ADMIN',
    accountStatus: 'ACTIVE',
    joinedDate: '2025-01-10',
    lastActive: '2026-08-24 12:30',
    department: 'Executive Operations',
  },
  {
    id: 'USR-1002',
    fullName: 'Priya Sharma',
    email: 'priya.sharma@foodie.com',
    phone: '+1 (555) 234-8901',
    role: 'OPS',
    accountStatus: 'ACTIVE',
    joinedDate: '2025-03-15',
    lastActive: '2026-08-24 11:45',
    department: 'Logistics & Merchant Ops',
  },
  {
    id: 'USR-1003',
    fullName: 'David Miller',
    email: 'david.m@foodie.com',
    phone: '+1 (555) 456-1122',
    role: 'FINANCE',
    accountStatus: 'ACTIVE',
    joinedDate: '2025-06-20',
    lastActive: '2026-08-23 16:10',
    department: 'Corporate Finance & Payouts',
  },
  {
    id: 'USR-1004',
    fullName: 'Rachel Green',
    email: 'rachel.green@foodie.com',
    phone: '+1 (555) 789-3344',
    role: 'SUPPORT',
    accountStatus: 'ACTIVE',
    joinedDate: '2025-09-01',
    lastActive: '2026-08-24 09:15',
    department: 'Customer Escalations Desk',
  },
  {
    id: 'USR-1005',
    fullName: 'Michael Scott',
    email: 'm.scott@foodie.com',
    phone: '+1 (555) 998-7766',
    role: 'OPS',
    accountStatus: 'SUSPENDED',
    joinedDate: '2026-02-14',
    lastActive: '2026-07-30 14:00',
    department: 'Regional Dispatch',
  },
];

export function UserManagementStudio() {
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('OPS');
  const [newDept, setNewDept] = useState('');

  const [selectedUserForStatus, setSelectedUserForStatus] = useState<AdminUser | null>(null);
  const [selectedUserForRole, setSelectedUserForRole] = useState<AdminUser | null>(null);
  const [targetRole, setTargetRole] = useState<AdminRole>('OPS');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || u.accountStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newEmail || !newPhone) return;

    const newUser: AdminUser = {
      id: `USR-${1000 + users.length + 1}`,
      fullName: newFullName,
      email: newEmail,
      phone: newPhone,
      role: newRole,
      accountStatus: 'ACTIVE',
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: 'Just Provisioned',
      department: newDept || 'Platform Administration',
    };

    setUsers((prev) => [newUser, ...prev]);
    showToast(`Successfully provisioned admin user: ${newFullName} (${newRole})`);

    // Reset form
    setNewFullName('');
    setNewEmail('');
    setNewPhone('');
    setNewRole('OPS');
    setNewDept('');
    setIsCreateModalOpen(false);
  };

  const handleToggleStatus = (id: string, currentStatus: UserAccountStatus) => {
    const nextStatus: UserAccountStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, accountStatus: nextStatus } : u)));
    showToast(`Updated user account ${id} status to ${nextStatus}`);
    setSelectedUserForStatus(null);
  };

  const handleUpdateRole = () => {
    if (!selectedUserForRole) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === selectedUserForRole.id ? { ...u, role: targetRole } : u))
    );
    showToast(`Updated ${selectedUserForRole.fullName}'s role to ${targetRole}`);
    setSelectedUserForRole(null);
  };

  const totalUsers = users.length;
  const activeAdmins = users.filter((u) => u.role === 'SUPER_ADMIN').length;
  const opsTeam = users.filter((u) => u.role === 'OPS').length;
  const supportFinance = users.filter((u) => u.role === 'SUPPORT' || u.role === 'FINANCE').length;

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
          <span style={{ fontSize: 12, color: '#F59E0B' }}>● Security Directory Updated</span>
        </div>
      ) : null}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F3D21', margin: 0 }}>
             Members & Admin User Directory
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0' }}>
            Provision, assign roles, manage system privileges, and monitor security status for platform staff.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            backgroundColor: '#0F3D21',
            color: '#FFFFFF',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 12px rgba(15,61,33,0.25)',
            transition: 'all 0.15s ease',
          }}
        >
          <span></span> Provision New Admin User
        </button>
      </div>

      {/* Executive Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Staff Members</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0F3D21', marginTop: 4 }}>{totalUsers}</div>
          <div style={{ fontSize: 12, color: '#166534', fontWeight: 600, marginTop: 6 }}>● Active Administrative Accounts</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Super Admins</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#7C3AED', marginTop: 4 }}>{activeAdmins}</div>
          <div style={{ fontSize: 12, color: '#7C3AED', fontWeight: 600, marginTop: 6 }}>Full Root System Privileges</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Operations Managers</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#047857', marginTop: 4 }}>{opsTeam}</div>
          <div style={{ fontSize: 12, color: '#047857', fontWeight: 600, marginTop: 6 }}>Dispatch & Merchant Ops</div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: '18px 20px', borderRadius: 14, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Finance & Support</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#B45309', marginTop: 4 }}>{supportFinance}</div>
          <div style={{ fontSize: 12, color: '#B45309', fontWeight: 600, marginTop: 6 }}>Payouts & Support Desk</div>
        </div>
      </div>

      {/* Directory Section */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0', padding: 20 }}>
        {/* Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Search users by name, email, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '9px 14px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                minWidth: 260,
                flex: 1,
              }}
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600 }}
            >
              <option value="ALL">Role: All Roles</option>
              <option value="SUPER_ADMIN"> Super Admin</option>
              <option value="OPS"> Operations</option>
              <option value="FINANCE"> Finance</option>
              <option value="SUPPORT"> Support Desk</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600 }}
            >
              <option value="ALL">Status: All Statuses</option>
              <option value="ACTIVE">● Active Only</option>
              <option value="SUSPENDED">○ Suspended Only</option>
            </select>
          </div>

          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
            Showing {filteredUsers.length} of {totalUsers} staff members
          </div>
        </div>

        {/* Directory Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Staff Member</th>
                <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Contact Info</th>
                <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Role Privilege</th>
                <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Department</th>
                <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Last Active</th>
                <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 700 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748B', fontWeight: 600 }}>
                    No administrative users match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleBadge = formatRoleBadge(user.role);
                  const statusBadge = formatStatusBadge(user.accountStatus);

                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
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
                            {user.fullName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F3D21' }}>{user.fullName}</div>
                            <div style={{ fontSize: 11, color: '#64748B' }}>ID: {user.id}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <div style={{ color: '#334155', fontWeight: 600 }}>{user.email}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{user.phone}</div>
                      </td>

                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            backgroundColor: roleBadge.bg,
                            color: roleBadge.color,
                            border: `1px solid ${roleBadge.border}`,
                          }}
                        >
                          {roleBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: '12px', color: '#475569', fontWeight: 600 }}>
                        {user.department}
                      </td>

                      <td style={{ padding: '12px' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 20,
                            backgroundColor: statusBadge.bg,
                            color: statusBadge.color,
                          }}
                        >
                          {statusBadge.label}
                        </span>
                      </td>

                      <td style={{ padding: '12px', fontSize: 12, color: '#64748B' }}>
                        {user.lastActive}
                      </td>

                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUserForRole(user);
                              setTargetRole(user.role);
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              border: '1px solid #CBD5E1',
                              backgroundColor: '#F8FAFC',
                              color: '#334155',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                             Edit Role
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedUserForStatus(user)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              border: '1px solid #CBD5E1',
                              backgroundColor: user.accountStatus === 'ACTIVE' ? '#FFF1F2' : '#F0FDF4',
                              color: user.accountStatus === 'ACTIVE' ? '#991B1B' : '#166534',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {user.accountStatus === 'ACTIVE' ? ' Suspend' : ' Re-activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROVISION USER MODAL */}
      {isCreateModalOpen ? (
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
          <form
            onSubmit={handleCreateUser}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 24,
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F3D21', margin: 0 }}>
                 Provision New Administrative User
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }}
              >
                
              </button>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Jenkins"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Work Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="e.g. s.jenkins@foodie.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Mobile Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +1 (555) 234-5678"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  System Role Privilege *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 600 }}
                >
                  <option value="OPS">Operations (OPS)</option>
                  <option value="FINANCE">Finance (FINANCE)</option>
                  <option value="SUPPORT">Support (SUPPORT)</option>
                  <option value="SUPER_ADMIN">Super Admin (SUPER_ADMIN)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dispatch & Logistics"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#0F3D21',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Provision User
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* EDIT ROLE MODAL */}
      {selectedUserForRole ? (
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
                 Update Role Privilege
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUserForRole(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }}
              >
                
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>
              Modify system access role for <strong>{selectedUserForRole.fullName}</strong> ({selectedUserForRole.email}).
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                Select Target Role Privilege
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as AdminRole)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
              >
                <option value="SUPER_ADMIN"> Super Admin (Full Control)</option>
                <option value="OPS"> Operations (Manage Merchants & Dispatch)</option>
                <option value="FINANCE"> Finance (Payments & Refunds)</option>
                <option value="SUPPORT"> Support Desk (Tickets Only)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setSelectedUserForRole(null)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#0F3D21',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Save Role Privilege
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* SUSPEND / RE-ACTIVATE MODAL */}
      {selectedUserForStatus ? (
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
                {selectedUserForStatus.accountStatus === 'ACTIVE' ? ' Suspend User Account' : ' Re-activate User Account'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUserForStatus(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }}
              >
                
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#475569', marginBottom: 20 }}>
              Are you sure you want to {selectedUserForStatus.accountStatus === 'ACTIVE' ? 'suspend' : 're-activate'}{' '}
              administrative access for <strong>{selectedUserForStatus.fullName}</strong> ({selectedUserForStatus.email})?
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setSelectedUserForStatus(null)}
                style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus(selectedUserForStatus.id, selectedUserForStatus.accountStatus)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: selectedUserForStatus.accountStatus === 'ACTIVE' ? '#DC2626' : '#166534',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Confirm {selectedUserForStatus.accountStatus === 'ACTIVE' ? 'Suspension' : 'Activation'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
