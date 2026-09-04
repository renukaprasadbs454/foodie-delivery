'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text, trackAnalyticsEvent, useTheme } from 'foodie-shared-web';
import { GAP_API_15_PARTNER_LIST } from '@/constants/gaps';
import { DeliveryPricingSettingsCard } from '../components/DeliveryPricingSettingsCard';

export interface DeliverymanRecord {
  id: string;
  name: string;
  phone: string;
  zone: string;
  vehicleType: 'Motorcycle' | 'Bicycle' | 'Electric Scooter';
  onlineStatus: 'ONLINE' | 'OFFLINE';
  cashInHand: number;
  totalDeliveries: number;
  rating: number;
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  documentType?: 'Aadhaar Card' | 'Driving License' | 'PAN Card' | 'Passport';
  documentNumber?: string;
  documentVerificationStatus?: 'VERIFIED' | 'PENDING' | 'REJECTED';
  uploadedDocumentName?: string;
}

const MOCK_PARTNERS: DeliverymanRecord[] = [
  {
    id: 'p1111111-2222-3333-4444-555555555555',
    name: 'Vikram Choudhary',
    phone: '+91 98111 22233',
    zone: 'Downtown Central',
    vehicleType: 'Motorcycle',
    onlineStatus: 'ONLINE',
    cashInHand: 1450,
    totalDeliveries: 480,
    rating: 4.9,
    kycStatus: 'VERIFIED',
    documentType: 'Driving License',
    documentNumber: 'DL-982347102934',
    documentVerificationStatus: 'VERIFIED',
    uploadedDocumentName: 'dl_vikram_verified.pdf',
  },
  {
    id: 'p2222222-3333-4444-5555-666666666666',
    name: 'Arjun Das',
    phone: '+91 98222 33344',
    zone: 'North Metro',
    vehicleType: 'Electric Scooter',
    onlineStatus: 'ONLINE',
    cashInHand: 620,
    totalDeliveries: 230,
    rating: 4.7,
    kycStatus: 'VERIFIED',
    documentType: 'Aadhaar Card',
    documentNumber: 'UID-8899-4433-2211',
    documentVerificationStatus: 'VERIFIED',
    uploadedDocumentName: 'aadhaar_arjun_scan.pdf',
  },
  {
    id: 'p3333333-4444-5555-6666-777777777777',
    name: 'Siddharth Rao',
    phone: '+91 98333 44455',
    zone: 'Westside Hub',
    vehicleType: 'Motorcycle',
    onlineStatus: 'OFFLINE',
    cashInHand: 0,
    totalDeliveries: 45,
    rating: 4.5,
    kycStatus: 'PENDING',
    documentType: 'Driving License',
    documentNumber: 'DL-773322119988',
    documentVerificationStatus: 'PENDING',
    uploadedDocumentName: 'dl_siddharth_pending.png',
  },
];

export function DeliveryPartnersPage() {
  const { tokens } = useTheme();
  const router = useRouter();
  const [partners, setPartners] = useState<DeliverymanRecord[]>(MOCK_PARTNERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'PENDING'>('ALL');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Partner Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newZone, setNewZone] = useState('Downtown Central');
  const [newVehicle, setNewVehicle] = useState<'Motorcycle' | 'Bicycle' | 'Electric Scooter'>('Motorcycle');

  // Document Verification State
  const [newDocumentType, setNewDocumentType] = useState<'Aadhaar Card' | 'Driving License' | 'PAN Card' | 'Passport'>('Driving License');
  const [newDocumentNumber, setNewDocumentNumber] = useState('');
  const [newDocumentStatus, setNewDocumentStatus] = useState<'VERIFIED' | 'PENDING'>('VERIFIED');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  useEffect(() => {
    trackAnalyticsEvent('admin_delivery_partners_viewed', {
      gapId: GAP_API_15_PARTNER_LIST,
    });
  }, []);

  const filteredPartners = partners.filter((p) => {
    const matchesTab = statusFilter === 'ALL' || p.kycStatus === statusFilter;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.documentNumber && p.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  const handleApproveKyc = (id: string) => {
    setPartners((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, kycStatus: 'VERIFIED', documentVerificationStatus: 'VERIFIED' }
          : p,
      ),
    );
    setToastMsg('Delivery partner KYC & document verified successfully');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) {
      alert('Please fill out Deliveryman Name and Contact Phone.');
      return;
    }
    if (!newDocumentNumber.trim()) {
      alert('Please provide an Identity Document Number (e.g. DL or Aadhaar number).');
      return;
    }

    const docName = uploadedFileName ?? `${newDocumentType.toLowerCase().replace(/\s+/g, '_')}_doc.pdf`;

    const newPartner: DeliverymanRecord = {
      id: `p-${Date.now().toString().slice(-4)}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      zone: newZone,
      vehicleType: newVehicle,
      onlineStatus: 'ONLINE',
      cashInHand: 0,
      totalDeliveries: 0,
      rating: 5.0,
      kycStatus: newDocumentStatus,
      documentType: newDocumentType,
      documentNumber: newDocumentNumber.trim(),
      documentVerificationStatus: newDocumentStatus,
      uploadedDocumentName: docName,
    };

    setPartners((prev) => [newPartner, ...prev]);
    setIsAddModalOpen(false);
    setNewName('');
    setNewPhone('');
    setNewDocumentNumber('');
    setUploadedFileName(null);
    setToastMsg(`Delivery partner "${newPartner.name}" registered with Verified Document (${newPartner.documentType})!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Text as="h1" variant="heading1" color="#14532D">
            Deliveryman & Fleet Management
          </Text>
          <Text as="p" variant="caption" color="#64748B">
            Monitor delivery dispatchers, verify driver KYC credentials & track cash collections
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => router.push('/delivery-payouts')}
            style={{
              padding: '10px 18px',
              backgroundColor: '#0F3D21',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
             Payouts & Reconciliation
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            style={{
              padding: '10px 18px',
              backgroundColor: '#14532D',
              color: '#F59E0B',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
             Register Deliveryman
          </button>
        </div>
      </div>

      {/* Delivery Partner Pricing Rules Card */}
      <DeliveryPricingSettingsCard />

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #14532D',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <Text as="span" variant="caption" color="#64748B">
            Active Delivery Fleet
          </Text>
          <Text as="h2" variant="heading1" color="#14532D" style={{ marginTop: 4 }}>
            {partners.length}
          </Text>
        </div>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #059669',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <Text as="span" variant="caption" color="#64748B">
            Currently Online
          </Text>
          <Text as="h2" variant="heading1" color="#059669" style={{ marginTop: 4 }}>
            {partners.filter((p) => p.onlineStatus === 'ONLINE').length}
          </Text>
        </div>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #F59E0B',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <Text as="span" variant="caption" color="#64748B">
            Pending KYC Reviews
          </Text>
          <Text as="h2" variant="heading1" color="#D97706" style={{ marginTop: 4 }}>
            {partners.filter((p) => p.kycStatus === 'PENDING').length}
          </Text>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '16px 20px',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {(['ALL', 'VERIFIED', 'PENDING'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: statusFilter === st ? '#14532D' : '#F1F5F9',
                color: statusFilter === st ? '#F59E0B' : '#475569',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {st === 'ALL' ? 'All Fleet' : st}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by Name, Zone, or Document No..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            width: 320,
            fontSize: 14,
            outline: 'none',
          }}
        />
      </div>

      {/* Deliverymen Table */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#14532D', fontWeight: 700 }}>
              <th style={{ padding: '14px 20px' }}>Deliveryman Name</th>
              <th style={{ padding: '14px 20px' }}>Contact Phone</th>
              <th style={{ padding: '14px 20px' }}>Vehicle & Zone</th>
              <th style={{ padding: '14px 20px' }}>Document Verification</th>
              <th style={{ padding: '14px 20px' }}>Live Availability</th>
              <th style={{ padding: '14px 20px' }}>Cash in Hand</th>
              <th style={{ padding: '14px 20px' }}>KYC Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPartners.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 700, color: '#14532D' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>#{p.id.slice(0, 8)}...</div>
                </td>
                <td style={{ padding: '16px 20px', fontWeight: 600, color: '#334155' }}>{p.phone}</td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, color: '#14532D' }}> {p.vehicleType}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{p.zone}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, color: '#0F172A', fontSize: 13 }}>
                     {p.documentType ?? 'Driving License'}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace', marginTop: 2 }}>
                    {p.documentNumber ?? 'DL-9811122233'}
                  </div>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor: p.documentVerificationStatus === 'PENDING' ? '#FEF3C7' : '#D1FAE5',
                      color: p.documentVerificationStatus === 'PENDING' ? '#B45309' : '#047857',
                    }}
                  >
                    {p.documentVerificationStatus === 'PENDING' ? ' Doc Pending' : ' Doc Verified'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: p.onlineStatus === 'ONLINE' ? '#047857' : '#64748B',
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: p.onlineStatus === 'ONLINE' ? '#10B981' : '#94A3B8',
                      }}
                    />
                    {p.onlineStatus}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', fontWeight: 700, color: '#D97706' }}>
                  ₹{p.cashInHand}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span
                    style={{
                      backgroundColor: p.kycStatus === 'VERIFIED' ? '#D1FAE5' : '#FEF3C7',
                      color: p.kycStatus === 'VERIFIED' ? '#047857' : '#B45309',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 20,
                    }}
                  >
                    {p.kycStatus}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  {p.kycStatus === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() => handleApproveKyc(p.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#14532D',
                        color: '#F59E0B',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Approve KYC
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push(`/delivery-partners/${p.id}`)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#F1F5F9',
                        color: '#334155',
                        border: '1px solid #CBD5E1',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      View Profile
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Register Deliveryman Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              width: 500,
              maxWidth: '92%',
              padding: 28,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <Text as="h2" variant="heading2" color="#14532D">
                  Register Delivery Partner
                </Text>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Submit driver credentials and mandatory identity document verification
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }}
              >
                
              </button>
            </div>

            <form onSubmit={handleAddPartner} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Basic Driver Details Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Vikram Choudhary"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Phone Number *</label>
                <input
                  type="text"
                  placeholder="+91 98111 22233"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Vehicle Type</label>
                  <select
                    value={newVehicle}
                    onChange={(e) => setNewVehicle(e.target.value as 'Motorcycle' | 'Bicycle' | 'Electric Scooter')}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  >
                    <option value="Motorcycle">Motorcycle</option>
                    <option value="Electric Scooter">Electric Scooter</option>
                    <option value="Bicycle">Bicycle</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Assigned Zone</label>
                  <select
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  >
                    <option value="Downtown Central">Downtown Central</option>
                    <option value="North Metro">North Metro</option>
                    <option value="Westside Hub">Westside Hub</option>
                    <option value="East Suburban">East Suburban</option>
                  </select>
                </div>
              </div>

              {/* Document & Identity Verification Section */}
              <div
                style={{
                  marginTop: 6,
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: '#14532D', display: 'flex', alignItems: 'center', gap: 6 }}>
                   Document & Identity Verification
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Document Type *</label>
                    <select
                      value={newDocumentType}
                      onChange={(e) => setNewDocumentType(e.target.value as any)}
                      style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                    >
                      <option value="Driving License">Driving License (DL)</option>
                      <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Passport">Passport</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Document ID Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. DL-9811223344"
                      value={newDocumentNumber}
                      onChange={(e) => setNewDocumentNumber(e.target.value)}
                      style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                      required
                    />
                  </div>
                </div>

                {/* Upload Verification Document File */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                    Upload Identity Document (Front & Back PDF / Photo)
                  </label>
                  <div
                    style={{
                      border: '1.5px dashed #CBD5E1',
                      borderRadius: 8,
                      padding: 12,
                      backgroundColor: '#FFFFFF',
                      textAlign: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      id="doc-upload-file"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadedFileName(e.target.files[0].name);
                        }
                      }}
                    />
                    <label htmlFor="doc-upload-file" style={{ cursor: 'pointer', fontSize: 12, color: '#047857', fontWeight: 600 }}>
                      {uploadedFileName ? ` Attached: ${uploadedFileName}` : ' Click to upload or select file (PDF, PNG, JPG)'}
                    </label>
                  </div>
                </div>

                {/* Document Verification Action Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Verification Status</label>
                  <select
                    value={newDocumentStatus}
                    onChange={(e) => setNewDocumentStatus(e.target.value as 'VERIFIED' | 'PENDING')}
                    style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  >
                    <option value="VERIFIED"> Approve & Mark Document Verified</option>
                    <option value="PENDING"> Submit for Admin Verification Review</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ padding: '10px 18px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#475569', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: 8, border: 'none', backgroundColor: '#14532D', color: '#F59E0B', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                >
                  Register Partner & Verify Doc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMsg ? (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: '#14532D',
            color: '#F59E0B',
            padding: '12px 24px',
            borderRadius: 8,
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
           {toastMsg}
        </div>
      ) : null}
    </div>
  );
}
