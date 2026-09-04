'use client';

import React, { useState } from 'react';

export type SettingsTab =
  | 'admin-profile'
  | 'admin-users'
  | 'roles-permissions'
  | 'commission-settings'
  | 'tax-gst'
  | 'payment-settings'
  | 'app-settings'
  | 'security'
  | 'page-setup';

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'OPS' | 'FINANCE' | 'SUPPORT';
  department: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLogin: string;
}

export interface PolicyPageRecord {
  id: string;
  slug: string;
  title: string;
  content: string;
  lastUpdated: string;
  status: 'PUBLISHED' | 'DRAFT';
}

const INITIAL_ADMIN_USERS: AdminUserRecord[] = [
  {
    id: 'u-101',
    name: 'Preethi Shree D',
    email: 'preethishreed@gmail.com',
    role: 'SUPER_ADMIN',
    department: 'Executive Leadership',
    status: 'ACTIVE',
    lastLogin: 'Just now',
  },
  {
    id: 'u-102',
    name: 'Rajesh Kumar',
    email: 'rajesh.ops@foodie.com',
    role: 'OPS',
    department: 'Dispatch & Fleet Operations',
    status: 'ACTIVE',
    lastLogin: '2 hours ago',
  },
  {
    id: 'u-103',
    name: 'Ananya Varma',
    email: 'ananya.fin@foodie.com',
    role: 'FINANCE',
    department: 'Accounts & Merchant Settlements',
    status: 'ACTIVE',
    lastLogin: '1 day ago',
  },
  {
    id: 'u-104',
    name: 'Suresh Patel',
    email: 'suresh.sup@foodie.com',
    role: 'SUPPORT',
    department: 'Customer Care & Complaints',
    status: 'ACTIVE',
    lastLogin: '3 days ago',
  },
];

const INITIAL_POLICY_PAGES: PolicyPageRecord[] = [
  {
    id: 'page-terms',
    slug: 'terms-and-conditions',
    title: 'Terms & Conditions',
    content:
      'Foodie Hyperlocal operates as an intermediary marketplace connecting customers, multi-vendor food merchants, cloud kitchens, and independent delivery partners. All users agree to adhere to platform code of conduct. Restaurants agree to maintain active FSSAI licenses.',
    lastUpdated: 'August 24, 2026',
    status: 'PUBLISHED',
  },
  {
    id: 'page-privacy',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    content:
      'All mobile app & web traffic is encrypted using TLS 1.3 protocol. User credentials and transaction logs are stored in encrypted database clusters. Driver KYC documents are stored in secure S3 buckets.',
    lastUpdated: 'August 24, 2026',
    status: 'PUBLISHED',
  },
  {
    id: 'page-cancellation',
    slug: 'cancellation-and-refund-policy',
    title: 'Cancellation & Refund Policy',
    content:
      'Cancellation refunds requested before kitchen food preparation starts are credited to Foodie Pay Wallet within 60 seconds. Post-preparation cancellations incur a nominal 50% kitchen compensation charge.',
    lastUpdated: 'August 24, 2026',
    status: 'PUBLISHED',
  },
  {
    id: 'page-delivery',
    slug: 'delivery-policy',
    title: 'Delivery Policy',
    content:
      'Standard delivery radius is capped at 12 km from restaurant location to ensure food fresh-temperature standards. Target delivery time is calculated dynamically based on Google Maps traffic API.',
    lastUpdated: 'August 24, 2026',
    status: 'PUBLISHED',
  },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('admin-profile');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Admin Profile State
  const [profileName, setProfileName] = useState('Preethi Shree D');
  const [profileEmail, setProfileEmail] = useState('preethishreed@gmail.com');
  const [profilePhone, setProfilePhone] = useState('+91 98765 43210');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 2. Admin Users State
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>(INITIAL_ADMIN_USERS);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'SUPER_ADMIN' | 'OPS' | 'FINANCE' | 'SUPPORT'>('OPS');
  const [newAdminDept, setNewAdminDept] = useState('Operations');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // 3. Roles & Permissions Matrix State
  const [permissions, setPermissions] = useState({
    SUPER_ADMIN: { dashboard: true, restaurants: true, deliveryKyc: true, refunds: true, commissions: true, auditLogs: true },
    OPS: { dashboard: true, restaurants: true, deliveryKyc: true, refunds: true, commissions: false, auditLogs: false },
    FINANCE: { dashboard: true, restaurants: false, deliveryKyc: false, refunds: true, commissions: true, auditLogs: false },
    SUPPORT: { dashboard: true, restaurants: false, deliveryKyc: false, refunds: false, commissions: false, auditLogs: false },
  });

  // 4. Commission Settings State
  const [baseCommission, setBaseCommission] = useState('15.0');
  const [restaurantCommission, setRestaurantCommission] = useState('18.0');
  const [cafeCommission, setCafeCommission] = useState('12.0');
  const [cloudKitchenCommission, setCloudKitchenCommission] = useState('15.0');

  // 5. Tax / GST State
  const [gstinNumber, setGstinNumber] = useState('29AAAAA0000A1Z5');
  const [foodGstRate, setFoodGstRate] = useState('5.0');
  const [deliveryGstRate, setDeliveryGstRate] = useState('18.0');
  const [tcsTaxRate, setTcsTaxRate] = useState('1.0');

  // 6. Payment Settings State
  const [razorpayEnabled, setRazorpayEnabled] = useState(true);
  const [stripeEnabled, setStripeEnabled] = useState(true);
  const [codEnabled, setCodEnabled] = useState(true);
  const [codMaxLimit, setCodMaxLimit] = useState('2000');

  // 7. App Settings State
  const [minAppVersion, setMinAppVersion] = useState('v2.4.0');
  const [forceUpdateEnabled, setForceUpdateEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maxDeliveryRadius, setMaxDeliveryRadius] = useState('15');

  // 8. Security State
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [require2FA, setRequire2FA] = useState(true);
  const [ipWhitelisting, setIpWhitelisting] = useState(false);

  // 9. Page Setup State (Terms, Privacy, Cancellation, Refund, Delivery, Custom Pages)
  const [policyPages, setPolicyPages] = useState<PolicyPageRecord[]>(INITIAL_POLICY_PAGES);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('page-terms');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // New Custom Page Modal
  const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageContent, setNewPageContent] = useState('');

  // Sync selected policy to edit state
  const selectedPolicy = policyPages.find((p) => p.id === selectedPolicyId) || policyPages[0];

  React.useEffect(() => {
    if (selectedPolicy) {
      setEditTitle(selectedPolicy.title);
      setEditContent(selectedPolicy.content);
    }
  }, [selectedPolicyId]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Save active policy edits if in page-setup
    if (activeTab === 'page-setup' && selectedPolicyId) {
      setPolicyPages((prev) =>
        prev.map((p) =>
          p.id === selectedPolicyId
            ? {
                ...p,
                title: editTitle,
                content: editContent,
                lastUpdated: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
              }
            : p
        )
      );
    }

    setTimeout(() => {
      setSaving(false);
      setToastMessage(' Control Center Settings & Policy Pages updated successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    }, 600);
  };

  const handleAddPolicyPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim() || !newPageContent.trim()) {
      alert('Please fill out Title and Content for the new policy page.');
      return;
    }

    const slug = newPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newPage: PolicyPageRecord = {
      id: `page-${Date.now()}`,
      slug,
      title: newPageTitle.trim(),
      content: newPageContent.trim(),
      lastUpdated: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      status: 'PUBLISHED',
    };

    setPolicyPages((prev) => [...prev, newPage]);
    setSelectedPolicyId(newPage.id);
    setIsAddPageModalOpen(false);
    setNewPageTitle('');
    setNewPageContent('');
    setToastMessage(`Policy Page "${newPage.title}" created & published!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            backgroundColor: '#14532D',
            color: '#F59E0B',
            padding: '12px 24px',
            borderRadius: 10,
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            fontSize: 14,
            fontWeight: 700,
            zIndex: 9999,
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#14532D', margin: 0 }}>
             Control Center Settings
          </h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0 0' }}>
            Configure admin profiles, policy page setups, commission rates, GST taxes, delivery pricing & security
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 22px',
            backgroundColor: saving ? '#6EE7B7' : '#14532D',
            color: '#F59E0B',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 800,
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(20, 83, 45, 0.25)',
            transition: 'all 0.15s ease',
          }}
        >
          {saving ? 'Saving Changes...' : ' Save Settings'}
        </button>
      </div>

      {/* Sidebar & Settings Main Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
        {/* Settings Navigation Sidebar */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            height: 'fit-content',
          }}
        >
          {[
            { id: 'admin-profile', label: 'Admin Profile' },
            { id: 'page-setup', label: 'Page Setup' },
            { id: 'admin-users', label: 'Admin Users' },
            { id: 'roles-permissions', label: 'Roles & Permissions' },
            { id: 'commission-settings', label: 'Commission Settings' },
            { id: 'tax-gst', label: 'Tax / GST' },
            { id: 'payment-settings', label: 'Payment Settings' },
            { id: 'app-settings', label: 'App Settings' },
            { id: 'security', label: 'Security' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: isActive ? '#FEF3C7' : 'transparent',
                  color: isActive ? '#14532D' : '#475569',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: 13,
                  cursor: 'pointer',
                  borderLeft: isActive ? '4px solid #F59E0B' : '4px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Settings Content Area */}
        <form onSubmit={handleSave}>
          {/* 1. Admin Profile */}
          {activeTab === 'admin-profile' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 28, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
                Personal Admin Profile
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Full Name</label>
                  <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Email Address</label>
                  <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Contact Phone</label>
                  <input type="text" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Assigned System Role</label>
                  <input type="text" value="SUPER_ADMIN (Full Control)" readOnly style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#047857', fontWeight: 700, fontSize: 13 }} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 20, marginTop: 10 }}>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#14532D', margin: '0 0 14px 0' }}>Password & Security Credentials</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Current Password</label>
                    <input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>New Password</label>
                    <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>Confirm New Password</label>
                    <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE SETUP (TERMS, PRIVACY, CANCELLATION, REFUND & CUSTOM POLICIES) */}
          {activeTab === 'page-setup' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 28, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
                    Platform Policy Page Setup
                  </h3>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Configure, edit, or add policy documents (Terms & Conditions, Privacy Policy, Cancellation & Refund Policy, Delivery Policy).
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddPageModalOpen(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#14532D',
                    color: '#F59E0B',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span></span> Add Custom Policy Page
                </button>
              </div>

              {/* Policy Page Selector Tabs */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', backgroundColor: '#F8FAFC', padding: 6, borderRadius: 10, border: '1px solid #E2E8F0' }}>
                {policyPages.map((page) => {
                  const isSelected = selectedPolicyId === page.id;
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => setSelectedPolicyId(page.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: 'none',
                        backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                        color: isSelected ? '#14532D' : '#64748B',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {page.title}
                    </button>
                  );
                })}
              </div>

              {/* Policy Content Editor */}
              {selectedPolicy && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#D1FAE5', color: '#047857', padding: '3px 8px', borderRadius: 6 }}>
                      STATUS: {selectedPolicy.status} • LAST REVISION: {selectedPolicy.lastUpdated}
                    </span>
                    <span style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>
                      URL Slug: /{selectedPolicy.slug}
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                      Document Title
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>
                      Policy Document Content (Markdown / HTML Supported)
                    </label>
                    <textarea
                      rows={10}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 8,
                        border: '1px solid #CBD5E1',
                        fontSize: 13,
                        lineHeight: 1.6,
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      Save Policy Document
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Admin Users */}
          {activeTab === 'admin-users' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 28, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>Admin Console Team</h3>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Manage admin accounts, executive access levels & operational personnel</div>
                </div>
                <button type="button" onClick={() => setIsAddUserModalOpen(true)} style={{ padding: '8px 16px', backgroundColor: '#14532D', color: '#F59E0B', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Add Admin User
                </button>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#14532D', fontWeight: 700 }}>
                    <th style={{ padding: '12px 16px' }}>User Name & Email</th>
                    <th style={{ padding: '12px 16px' }}>Role</th>
                    <th style={{ padding: '12px 16px' }}>Department</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px' }}>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((u) => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#FEF3C7', color: '#B45309', padding: '3px 8px', borderRadius: 4 }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#475569' }}>{u.department}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ backgroundColor: '#D1FAE5', color: '#047857', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 12 }}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 12 }}>{u.lastLogin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Roles & Permissions */}
          {activeTab === 'roles-permissions' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 28, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>Role-Based Access Control (RBAC)</h3>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Configure permissions matrix for SUPER_ADMIN, OPS, FINANCE, and SUPPORT roles</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#14532D', fontWeight: 700 }}>
                    <th style={{ padding: '12px 16px' }}>System Permission Scope</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>SUPER_ADMIN</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>OPS</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>FINANCE</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>SUPPORT</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Access Executive Dashboard & Analytics', key: 'dashboard' },
                    { label: 'Approve / Suspend Restaurants', key: 'restaurants' },
                    { label: 'Verify Deliveryman KYC & Documents', key: 'deliveryKyc' },
                    { label: 'Issue Payment Refunds & Payouts', key: 'refunds' },
                    { label: 'Manage Commission Rates & Rules', key: 'commissions' },
                    { label: 'View System Audit Logs', key: 'auditLogs' },
                  ].map((perm) => (
                    <tr key={perm.key} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1E293B' }}>{perm.label}</td>
                      {(['SUPER_ADMIN', 'OPS', 'FINANCE', 'SUPPORT'] as const).map((r) => (
                        <td key={r} style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={permissions[r][perm.key as keyof typeof permissions['SUPER_ADMIN']]}
                            onChange={(e) => {
                              const val = e.target.checked;
                              setPermissions((prev) => ({
                                ...prev,
                                [r]: { ...prev[r], [perm.key]: val },
                              }));
                            }}
                            style={{ width: 16, height: 16, accentColor: '#14532D' }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Commission Settings */}
          {activeTab === 'commission-settings' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 28, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>Marketplace Commission Rates</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Global Base Commission Rate (%)</label>
                  <input type="number" value={baseCommission} onChange={(e) => setBaseCommission(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Fine Dining & Pizzerias (%)</label>
                  <input type="number" value={restaurantCommission} onChange={(e) => setRestaurantCommission(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Cafes & Bakery Rate (%)</label>
                  <input type="number" value={cafeCommission} onChange={(e) => setCafeCommission(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Cloud Kitchens Rate (%)</label>
                  <input type="number" value={cloudKitchenCommission} onChange={(e) => setCloudKitchenCommission(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                </div>
              </div>
            </div>
          )}

          {/* 5. Tax / GST */}
          {activeTab === 'tax-gst' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 28, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>Tax & GST Compliance Rules</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>GSTIN Number</label>
                  <input type="text" value={gstinNumber} onChange={(e) => setGstinNumber(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Food Order GST Rate (%)</label>
                  <input type="number" value={foodGstRate} onChange={(e) => setFoodGstRate(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Delivery Service GST (%)</label>
                  <input type="number" value={deliveryGstRate} onChange={(e) => setDeliveryGstRate(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>TCS Tax Rate (%)</label>
                  <input type="number" value={tcsTaxRate} onChange={(e) => setTcsTaxRate(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                </div>
              </div>
            </div>
          )}

          {/* 6. Payment Settings */}
          {activeTab === 'payment-settings' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 28, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>Payment Gateways & COD Rules</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={razorpayEnabled} onChange={(e) => setRazorpayEnabled(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#14532D' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Enable Razorpay Gateway (UPI, Netbanking, Cards)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={stripeEnabled} onChange={(e) => setStripeEnabled(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#14532D' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Enable Stripe Gateway (International Cards)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={codEnabled} onChange={(e) => setCodEnabled(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#14532D' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Enable Cash on Delivery (COD)</span>
                </label>
              </div>

              <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 16, marginTop: 8 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Max Order Limit for Cash on Delivery (₹)</label>
                <input type="number" value={codMaxLimit} onChange={(e) => setCodMaxLimit(e.target.value)} style={{ width: '100%', maxWidth: 300, padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
              </div>
            </div>
          )}

          {/* 7. App Settings */}
          {activeTab === 'app-settings' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 28, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>Customer App & Operational Parameters</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Minimum Required App Version</label>
                  <input type="text" value={minAppVersion} onChange={(e) => setMinAppVersion(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Max Operating Delivery Radius (KM)</label>
                  <input type="number" value={maxDeliveryRadius} onChange={(e) => setMaxDeliveryRadius(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #F1F5F9', paddingTop: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={forceUpdateEnabled} onChange={(e) => setForceUpdateEnabled(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#14532D' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>Enforce Mandatory App Update Alert</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={maintenanceMode} onChange={(e) => setMaintenanceMode(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#14532D' }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: maintenanceMode ? '#DC2626' : '#0F172A' }}>Enable Emergency Maintenance Mode</span>
                </label>
              </div>
            </div>
          )}

          {/* 8. Security */}
          {activeTab === 'security' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, padding: 28, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>Security, Sessions & IP Rules</h3>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#14532D', marginBottom: 6 }}>Admin Inactivity Timeout (Minutes)</label>
                <input type="number" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} style={{ width: '100%', maxWidth: 300, padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 12, borderTop: '1px solid #F1F5F9' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={require2FA} onChange={(e) => setRequire2FA(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#14532D' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Enforce Two-Factor Authentication (2FA)</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Require 2FA verification for all SUPER_ADMIN and FINANCE logins.</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={ipWhitelisting} onChange={(e) => setIpWhitelisting(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#14532D' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Restrict Console Access to Whitelisted IP Ranges</div>
                    <div style={{ fontSize: 12, color: '#64748B' }}>Block access from unapproved external networks.</div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* ADD CUSTOM POLICY PAGE MODAL */}
      {isAddPageModalOpen ? (
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
            onSubmit={handleAddPolicyPage}
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
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
                 Create Custom Policy Page
              </h3>
              <button
                type="button"
                onClick={() => setIsAddPageModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }}
              >
                
              </button>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Page Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Merchant Code of Conduct"
                value={newPageTitle}
                onChange={(e) => setNewPageTitle(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 4 }}>
                Policy Content *
              </label>
              <textarea
                rows={6}
                required
                placeholder="State policy guidelines and operational terms..."
                value={newPageContent}
                onChange={(e) => setNewPageContent(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={() => setIsAddPageModalOpen(false)}
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
                  backgroundColor: '#14532D',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Publish Policy Page
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
