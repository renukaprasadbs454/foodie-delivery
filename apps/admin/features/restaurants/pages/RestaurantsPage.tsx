'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Text, trackAnalyticsEvent, useTheme } from 'foodie-shared-web';
import { GAP_API_14_RESTAURANT_LIST } from '@/constants/gaps';
import { useAppSelector } from '@/store/hooks';
import { selectActiveModule } from '@/store/moduleSlice';

export interface StoreItem {
  id: string;
  name: string;
  module: string;
  ownerName: string;
  phone: string;
  zone: string;
  rating: number;
  ordersCount: number;
  commissionRate: number;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  joinedDate: string;
}

const MOCK_STORES: StoreItem[] = [
  {
    id: 'b7c2a110-92d4-4f81-9b11-a83d712e5001',
    name: 'Royal Biryani House',
    module: 'North Indian & Biryani',
    ownerName: 'Rahul Sharma',
    phone: '+91 98765 43210',
    zone: 'Downtown Central',
    rating: 4.8,
    ordersCount: 1420,
    commissionRate: 15,
    status: 'ACTIVE',
    joinedDate: '2025-01-15',
  },
  {
    id: 'c8d3b221-03e5-5f92-ac22-b94e823f6002',
    name: 'Bella Italia Pizzeria',
    module: 'Italian & Wood-Fired Pizza',
    ownerName: 'Priya Patel',
    phone: '+91 98123 45678',
    zone: 'North Metro',
    rating: 4.6,
    ordersCount: 890,
    commissionRate: 12,
    status: 'ACTIVE',
    joinedDate: '2025-02-01',
  },
  {
    id: 'd9e4c332-14f6-6fa3-bd33-ca5f934a7003',
    name: 'Sweet Dreams Bakery & Cafe',
    module: 'Bakery & Desserts',
    ownerName: 'Suresh Kumar',
    phone: '+91 97890 12345',
    zone: 'Westside Hub',
    rating: 4.9,
    ordersCount: 650,
    commissionRate: 10,
    status: 'PENDING',
    joinedDate: '2025-03-10',
  },
  {
    id: 'e0f5d443-25a7-70b4-ce44-db6a045b8004',
    name: 'The Gourmet Burger Bistro',
    module: 'Burgers & Fast Food',
    ownerName: 'Ananya Verma',
    phone: '+91 96543 21098',
    zone: 'Downtown Central',
    rating: 4.5,
    ordersCount: 310,
    commissionRate: 15,
    status: 'SUSPENDED',
    joinedDate: '2025-01-20',
  },
  {
    id: 'f1a6e554-36b8-81c5-df55-ec7b156c9005',
    name: 'Dragon Bowl Asian Kitchen',
    module: 'Chinese & Pan-Asian',
    ownerName: 'Vikram Singh',
    phone: '+91 95432 10987',
    zone: 'East Suburban',
    rating: 4.7,
    ordersCount: 540,
    commissionRate: 12,
    status: 'ACTIVE',
    joinedDate: '2025-02-18',
  },
];

export function RestaurantsPage() {
  const { tokens } = useTheme();
  const router = useRouter();
  const activeModule = useAppSelector(selectActiveModule);
  const [stores, setStores] = useState<StoreItem[]>(MOCK_STORES);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'SUSPENDED'>('ALL');
  const [selectedStore, setSelectedStore] = useState<StoreItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Vendor Form State
  const [newVendorName, setNewVendorName] = useState('');
  const [newModule, setNewModule] = useState('North Indian & Biryani');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newZone, setNewZone] = useState('Downtown Central');
  const [newCommission, setNewCommission] = useState('15');

  useEffect(() => {
    trackAnalyticsEvent('admin_restaurants_viewed', {
      gapId: GAP_API_14_RESTAURANT_LIST,
    });
  }, []);

  const filteredStores = stores.filter((s) => {
    const matchesTab = activeTab === 'ALL' || s.status === activeTab;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.zone.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesModule = true;
    if (activeModule === 'RESTAURANTS') {
      matchesModule = s.module.includes('Indian') || s.module.includes('Italian') || s.module.includes('Pizza');
    } else if (activeModule === 'CAFES') {
      matchesModule = s.module.includes('Bakery') || s.module.includes('Desserts') || s.module.includes('Cafe');
    } else if (activeModule === 'CLOUD_KITCHEN') {
      matchesModule = s.module.includes('Burgers') || s.module.includes('Fast Food') || s.module.includes('Asian');
    }

    return matchesTab && matchesSearch && matchesModule;
  });

  const handleUpdateStatus = (storeId: string, newStatus: 'ACTIVE' | 'SUSPENDED') => {
    setStores((prev) =>
      prev.map((s) => (s.id === storeId ? { ...s, status: newStatus } : s)),
    );
    setToastMessage(`Store status updated to ${newStatus}`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorName.trim() || !newOwnerName.trim() || !newPhone.trim()) {
      alert('Please fill out Restaurant Name, Owner Name, and Contact Phone.');
      return;
    }
    const newStore: StoreItem = {
      id: `store-${Date.now().toString().slice(-4)}`,
      name: newVendorName.trim(),
      module: newModule,
      ownerName: newOwnerName.trim(),
      phone: newPhone.trim(),
      zone: newZone,
      rating: 5.0,
      ordersCount: 0,
      commissionRate: Number(newCommission) || 15,
      status: 'ACTIVE',
      joinedDate: new Date().toISOString().split('T')[0],
    };

    setStores((prev) => [newStore, ...prev]);
    setIsAddModalOpen(false);
    setNewVendorName('');
    setNewOwnerName('');
    setNewPhone('');
    setToastMessage(`New restaurant "${newStore.name}" registered successfully!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <Text as="h1" variant="heading1" color="#14532D">
            Multi-Vendor Store Management
          </Text>
          <Text as="p" variant="caption" color="#64748B">
            Manage, approve, and monitor stores & restaurants across all marketplace modules
          </Text>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
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
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <span></span> Add New Vendor
          </button>
        </div>
      </div>

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
            Total Stores
          </Text>
          <Text as="h2" variant="heading1" color="#14532D" style={{ marginTop: 4 }}>
            {stores.length}
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
            Active Vendors
          </Text>
          <Text as="h2" variant="heading1" color="#059669" style={{ marginTop: 4 }}>
            {stores.filter((s) => s.status === 'ACTIVE').length}
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
            Pending Approvals
          </Text>
          <Text as="h2" variant="heading1" color="#D97706" style={{ marginTop: 4 }}>
            {stores.filter((s) => s.status === 'PENDING').length}
          </Text>
        </div>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '20px',
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            borderTop: '4px solid #DC2626',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
          }}
        >
          <Text as="span" variant="caption" color="#64748B">
            Suspended
          </Text>
          <Text as="h2" variant="heading1" color="#DC2626" style={{ marginTop: 4 }}>
            {stores.filter((s) => s.status === 'SUSPENDED').length}
          </Text>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
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
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: activeTab === tab ? '#14532D' : '#F1F5F9',
                color: activeTab === tab ? '#F59E0B' : '#475569',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {tab === 'ALL' ? 'All Stores' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search by store name, zone, or UUID..."
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

      {/* Stores Data Table */}
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
              <th style={{ padding: '14px 20px' }}>Store Info</th>
              <th style={{ padding: '14px 20px' }}>Module</th>
              <th style={{ padding: '14px 20px' }}>Owner & Contact</th>
              <th style={{ padding: '14px 20px' }}>Zone</th>
              <th style={{ padding: '14px 20px' }}>Rating & Orders</th>
              <th style={{ padding: '14px 20px' }}>Commission</th>
              <th style={{ padding: '14px 20px' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStores.map((store) => (
              <tr key={store.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 700, color: '#14532D' }}>{store.name}</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>{store.id}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span
                    style={{
                      backgroundColor: '#FEF3C7',
                      color: '#D97706',
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '4px 8px',
                      borderRadius: 6,
                    }}
                  >
                    {store.module}
                  </span>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, color: '#334155' }}>{store.ownerName}</div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{store.phone}</div>
                </td>
                <td style={{ padding: '16px 20px', color: '#475569', fontWeight: 500 }}>{store.zone}</td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#D97706' }}>
                    <span> {store.rating}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B' }}>{store.ordersCount} orders</div>
                </td>
                <td style={{ padding: '16px 20px', fontWeight: 700, color: '#14532D' }}>
                  {store.commissionRate}%
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span
                    style={{
                      backgroundColor:
                        store.status === 'ACTIVE'
                          ? '#D1FAE5'
                          : store.status === 'PENDING'
                          ? '#FEF3C7'
                          : '#FEE2E2',
                      color:
                        store.status === 'ACTIVE'
                          ? '#047857'
                          : store.status === 'PENDING'
                          ? '#B45309'
                          : '#B91C1C',
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 20,
                    }}
                  >
                    {store.status}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    {store.status !== 'ACTIVE' ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(store.id, 'ACTIVE')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#14532D',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(store.id, 'SUSPENDED')}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#FEE2E2',
                          color: '#991B1B',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Suspend
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => router.push(`/restaurants/${store.id}`)}
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
                      Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add New Vendor Modal */}
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
              width: 480,
              maxWidth: '90%',
              padding: 28,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text as="h2" variant="heading2" color="#14532D">
                Register New Restaurant
              </Text>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748B' }}
              >
                
              </button>
            </div>

            <form onSubmit={handleAddVendor} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Restaurant Name</label>
                <input
                  type="text"
                  placeholder="e.g. Spice Junction Curry House"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Cuisine Category</label>
                  <select
                    value={newModule}
                    onChange={(e) => setNewModule(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  >
                    <option value="North Indian & Biryani">North Indian & Biryani</option>
                    <option value="Italian & Wood-Fired Pizza">Italian & Wood-Fired Pizza</option>
                    <option value="Bakery & Desserts">Bakery & Desserts</option>
                    <option value="Burgers & Fast Food">Burgers & Fast Food</option>
                    <option value="Chinese & Pan-Asian">Chinese & Pan-Asian</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Delivery Zone</label>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Owner Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Commission Rate (%)</label>
                <input
                  type="number"
                  placeholder="15"
                  value={newCommission}
                  onChange={(e) => setNewCommission(e.target.value)}
                  style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
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
                  Save Restaurant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage ? (
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
           {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
