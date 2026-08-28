'use client';

import React, { useState } from 'react';

export interface StateItem {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface ZoneItem {
  id: string;
  stateId: string;
  name: string;
  cityName: string;
  active: boolean;
}

export interface WarehouseItem {
  id: string;
  code: string;
  name: string;
  stateId: string;
  zoneId: string;
  address: string;
  capacityUnits: number;
  active: boolean;
}

export interface DarkStoreItem {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
  stateId: string;
  deliveryRadiusKm: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SellerItem {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  stateId: string;
  preferredWarehouseId: string | null;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
}

type HierarchyTab = 'MASTER_LOCATIONS' | 'WAREHOUSES' | 'DARKSTORES' | 'SELLERS';

const INITIAL_STATES: StateItem[] = [
  { id: 'st-ka', code: 'KA', name: 'Karnataka', active: true },
  { id: 'st-mh', code: 'MH', name: 'Maharashtra', active: true },
  { id: 'st-dl', code: 'DL', name: 'Delhi NCR', active: true },
  { id: 'st-tn', code: 'TN', name: 'Tamil Nadu', active: true },
];

const INITIAL_ZONES: ZoneItem[] = [
  { id: 'zn-ka-01', stateId: 'st-ka', name: 'Indiranagar Tech Hub Zone', cityName: 'Bangalore', active: true },
  { id: 'zn-ka-02', stateId: 'st-ka', name: 'Koramangala Food Strip Zone', cityName: 'Bangalore', active: true },
  { id: 'zn-mh-01', stateId: 'st-mh', name: 'Bandra West Commerce Zone', cityName: 'Mumbai', active: true },
  { id: 'zn-dl-01', stateId: 'st-dl', name: 'Connaught Place Commercial Zone', cityName: 'New Delhi', active: true },
];

const INITIAL_WAREHOUSES: WarehouseItem[] = [
  {
    id: 'wh-ka-central',
    code: 'KA-WH-CENTRAL-01',
    name: 'Bangalore Central Mega Fulfillment Warehouse',
    stateId: 'st-ka',
    zoneId: 'zn-ka-01',
    address: 'Plot 42, Outer Ring Road, Indiranagar',
    capacityUnits: 100000,
    active: true,
  },
  {
    id: 'wh-ka-south',
    code: 'KA-WH-SOUTH-02',
    name: 'South Bangalore Logistics Hub',
    stateId: 'st-ka',
    zoneId: 'zn-ka-02',
    address: 'Sector 5, 80 Feet Road, Koramangala',
    capacityUnits: 85000,
    active: true,
  },
  {
    id: 'wh-mh-mumbai',
    code: 'MH-WH-MUMBAI-01',
    name: 'Mumbai Metro Regional Warehouse',
    stateId: 'st-mh',
    zoneId: 'zn-mh-01',
    address: 'SV Road, Bandra West, Mumbai',
    capacityUnits: 120000,
    active: true,
  },
];

const INITIAL_DARKSTORES: DarkStoreItem[] = [
  {
    id: 'ds-ka-01',
    code: 'KA-DS-INDIRANAGAR-01',
    name: 'Indiranagar Quick-Store #101',
    warehouseId: 'wh-ka-central',
    stateId: 'st-ka',
    deliveryRadiusKm: 4.5,
    status: 'ACTIVE',
  },
  {
    id: 'ds-ka-02',
    code: 'KA-DS-KORAMANGALA-02',
    name: 'Koramangala Express Darkstore #102',
    warehouseId: 'wh-ka-south',
    stateId: 'st-ka',
    deliveryRadiusKm: 5.0,
    status: 'ACTIVE',
  },
];

const INITIAL_SELLERS: SellerItem[] = [
  {
    id: 'sel-301',
    businessName: 'FreshFarm Organic Groceries Ltd',
    ownerName: 'Vikramaditya Rao',
    email: 'contact@freshfarm.in',
    phone: '+91 98765 43210',
    stateId: 'st-ka',
    preferredWarehouseId: 'wh-ka-central',
    approvalStatus: 'APPROVED',
  },
  {
    id: 'sel-302',
    businessName: 'Nandini Dairy Direct Traders',
    ownerName: 'Suresh Gowda',
    email: 'supply@nandinidirect.com',
    phone: '+91 98111 22233',
    stateId: 'st-ka',
    preferredWarehouseId: null,
    approvalStatus: 'PENDING',
  },
];

export default function DarkstoreHierarchyPage() {
  const [activeTab, setActiveTab] = useState<HierarchyTab>('MASTER_LOCATIONS');

  // State Management
  const [states, setStates] = useState<StateItem[]>(INITIAL_STATES);
  const [zones, setZones] = useState<ZoneItem[]>(INITIAL_ZONES);
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>(INITIAL_WAREHOUSES);
  const [darkStores, setDarkStores] = useState<DarkStoreItem[]>(INITIAL_DARKSTORES);
  const [sellers, setSellers] = useState<SellerItem[]>(INITIAL_SELLERS);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Form Modals State
  const [isAddStateModal, setIsAddStateModal] = useState(false);
  const [stateCode, setStateCode] = useState('');
  const [stateName, setStateName] = useState('');

  const [isAddZoneModal, setIsAddZoneModal] = useState(false);
  const [zoneStateId, setZoneStateId] = useState('st-ka');
  const [zoneName, setZoneName] = useState('');
  const [zoneCity, setZoneCity] = useState('');

  const [isAddWarehouseModal, setIsAddWarehouseModal] = useState(false);
  const [whStateId, setWhStateId] = useState('st-ka');
  const [whZoneId, setWhZoneId] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whName, setWhName] = useState('');
  const [whAddress, setWhAddress] = useState('');
  const [whCapacity, setWhCapacity] = useState(50000);

  const [isAddDarkstoreModal, setIsAddDarkstoreModal] = useState(false);
  const [dsWarehouseId, setDsWarehouseId] = useState('wh-ka-central');
  const [dsCode, setDsCode] = useState('');
  const [dsName, setDsName] = useState('');
  const [dsRadius, setDsRadius] = useState(4.0);

  const [selectedSellerForOnboarding, setSelectedSellerForOnboarding] = useState<SellerItem | null>(null);
  const [sellerTargetStateId, setSellerTargetStateId] = useState('st-ka');
  const [sellerTargetWarehouseId, setSellerTargetWarehouseId] = useState('');

  // Filtering Functions
  const filteredZonesForWh = zones.filter((z) => z.stateId === whStateId);
  const selectedWhForDs = warehouses.find((w) => w.id === dsWarehouseId);
  const parentStateForDs = states.find((s) => s.id === selectedWhForDs?.stateId);

  const filteredWarehousesForSeller = warehouses.filter((w) => w.stateId === sellerTargetStateId);

  // Handlers
  const handleAddState = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stateCode || !stateName) return;

    const newState: StateItem = {
      id: `st-${stateCode.toLowerCase()}`,
      code: stateCode.toUpperCase(),
      name: stateName,
      active: true,
    };

    setStates((prev) => [...prev, newState]);
    setIsAddStateModal(false);
    setStateCode('');
    setStateName('');
    showToast(`State "${newState.name}" (${newState.code}) created successfully!`);
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName || !zoneCity) return;

    const newZone: ZoneItem = {
      id: `zn-${Date.now()}`,
      stateId: zoneStateId,
      name: zoneName,
      cityName: zoneCity,
      active: true,
    };

    setZones((prev) => [...prev, newZone]);
    setIsAddZoneModal(false);
    setZoneName('');
    setZoneCity('');
    showToast(`Delivery Zone "${newZone.name}" created under State!`);
  };

  const handleAddWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whName || !whCode || !whZoneId) return;

    const newWh: WarehouseItem = {
      id: `wh-${Date.now()}`,
      code: whCode.toUpperCase(),
      name: whName,
      stateId: whStateId,
      zoneId: whZoneId,
      address: whAddress || 'Central Industrial Logistics Park',
      capacityUnits: Number(whCapacity),
      active: true,
    };

    setWarehouses((prev) => [...prev, newWh]);
    setIsAddWarehouseModal(false);
    setWhCode('');
    setWhName('');
    setWhAddress('');
    showToast(`Warehouse "${newWh.name}" created under State -> Zone hierarchy!`);
  };

  const handleAddDarkStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dsName || !dsCode || !selectedWhForDs) return;

    // RULE ENFORCEMENT: Dark Store must belong to the exact same State as parent Warehouse
    const derivedStateId = selectedWhForDs.stateId;

    const newDs: DarkStoreItem = {
      id: `ds-${Date.now()}`,
      code: dsCode.toUpperCase(),
      name: dsName,
      warehouseId: dsWarehouseId,
      stateId: derivedStateId,
      deliveryRadiusKm: Number(dsRadius),
      status: 'ACTIVE',
    };

    setDarkStores((prev) => [...prev, newDs]);
    setIsAddDarkstoreModal(false);
    setDsCode('');
    setDsName('');
    showToast(`Dark Store "${newDs.name}" created under Warehouse! Strictly inherited State: ${parentStateForDs?.name}`);
  };

  const handleApproveSellerOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSellerForOnboarding || !sellerTargetWarehouseId) return;

    setSellers((prev) =>
      prev.map((s) =>
        s.id === selectedSellerForOnboarding.id
          ? {
              ...s,
              stateId: sellerTargetStateId,
              preferredWarehouseId: sellerTargetWarehouseId,
              approvalStatus: 'APPROVED',
            }
          : s
      )
    );

    setSelectedSellerForOnboarding(null);
    showToast(`Approved seller "${selectedSellerForOnboarding.businessName}" and connected to state-filtered Warehouse!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* Toast Banner */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            backgroundColor: '#0F3D21',
            color: '#F59E0B',
            padding: '14px 24px',
            borderRadius: 12,
            fontWeight: 800,
            fontSize: 14,
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            zIndex: 9999,
          }}
        >
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
          Dark Store Grocery Hierarchy & Onboarding Setup
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Strict State-Based Grocery Hierarchy: <strong>State → Zone → Warehouse → Dark Store</strong> & State-Filtered Seller Onboarding
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          backgroundColor: '#FFFFFF',
          padding: 8,
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'MASTER_LOCATIONS', label: '1. Master Locations (State & Zones)' },
          { id: 'WAREHOUSES', label: `2. Warehouse Setup (${warehouses.length})` },
          { id: 'DARKSTORES', label: `3. Dark Stores Setup (${darkStores.length})` },
          { id: 'SELLERS', label: `4. Seller Onboarding & Supply (${sellers.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as HierarchyTab)}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#0F3D21' : 'transparent',
              color: activeTab === tab.id ? '#F59E0B' : '#475569',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MASTER LOCATIONS (STATE & ZONES) */}
      {activeTab === 'MASTER_LOCATIONS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="button"
              onClick={() => setIsAddStateModal(true)}
              style={{ padding: '9px 16px', backgroundColor: '#FFFFFF', border: '1.5px solid #0F3D21', color: '#0F3D21', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
            >
              + Create State
            </button>
            <button
              type="button"
              onClick={() => setIsAddZoneModal(true)}
              style={{ padding: '9px 16px', backgroundColor: '#0F3D21', border: 'none', color: '#F59E0B', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
            >
              + Add Zone under State
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {states.map((st) => {
              const stateZones = zones.filter((z) => z.stateId === st.id);
              const stateWhs = warehouses.filter((w) => w.stateId === st.id);

              return (
                <div
                  key={st.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 14,
                    padding: 20,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0F3D21' }}>
                      {st.name} ({st.code})
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#D1FAE5', color: '#047857', padding: '3px 8px', borderRadius: 6 }}>
                      STATE ACTIVE
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: '#64748B', display: 'flex', gap: 12, fontWeight: 700 }}>
                    <span>{stateZones.length} Delivery Zones</span>
                    <span>{stateWhs.length} Warehouses</span>
                  </div>

                  {/* Zones under this state */}
                  <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 8, textTransform: 'uppercase' }}>
                      Delivery Zones in {st.name}:
                    </div>

                    {stateZones.length === 0 ? (
                      <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No zones added for this state yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {stateZones.map((z) => (
                          <div
                            key={z.id}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 6,
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#1E293B',
                              display: 'flex',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span>{z.name}</span>
                            <span style={{ color: '#64748B', fontWeight: 500 }}>{z.cityName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: WAREHOUSE SETUP (STATE -> ZONE -> WAREHOUSE) */}
      {activeTab === 'WAREHOUSES' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
                Warehouse Setup (`State → Zone → Warehouse`)
              </h3>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Admin maps each Warehouse strictly to a selected State and a Zone of that State.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddWarehouseModal(true)}
              style={{ padding: '9px 16px', backgroundColor: '#0F3D21', border: 'none', color: '#F59E0B', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
            >
              + Add Warehouse under State & Zone
            </button>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '12px 16px' }}>Warehouse Code & Name</th>
                  <th style={{ padding: '12px 16px' }}>State Location</th>
                  <th style={{ padding: '12px 16px' }}>Mapped Zone</th>
                  <th style={{ padding: '12px 16px' }}>Address</th>
                  <th style={{ padding: '12px 16px' }}>Capacity Units</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {warehouses.map((wh) => {
                  const stateObj = states.find((s) => s.id === wh.stateId);
                  const zoneObj = zones.find((z) => z.id === wh.zoneId);

                  return (
                    <tr key={wh.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0F3D21' }}>{wh.name}</div>
                        <div style={{ fontSize: 11, color: '#0284C7', fontFamily: 'monospace' }}>{wh.code}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#334155' }}>
                        {stateObj?.name || wh.stateId} ({stateObj?.code})
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>
                        {zoneObj?.name || wh.zoneId}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748B' }}>{wh.address}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0F3D21' }}>
                        {wh.capacityUnits.toLocaleString()} units
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#D1FAE5', color: '#047857', padding: '3px 8px', borderRadius: 4 }}>
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DARK STORE SETUP (WAREHOUSE -> DARK STORE) */}
      {activeTab === 'DARKSTORES' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
                Dark Store Setup (`Warehouse → Dark Store`)
              </h3>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                <strong>Important Rule</strong>: Dark Store is created under a selected Warehouse and <strong>must remain inside the exact same State</strong> as its parent Warehouse.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddDarkstoreModal(true)}
              style={{ padding: '9px 16px', backgroundColor: '#0F3D21', border: 'none', color: '#F59E0B', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
            >
              + Create Dark Store under Warehouse
            </button>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '12px 16px' }}>Dark Store Code & Name</th>
                  <th style={{ padding: '12px 16px' }}>Parent Warehouse</th>
                  <th style={{ padding: '12px 16px' }}>Inherited State (Strict)</th>
                  <th style={{ padding: '12px 16px' }}>Delivery Radius</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {darkStores.map((ds) => {
                  const whObj = warehouses.find((w) => w.id === ds.warehouseId);
                  const stObj = states.find((s) => s.id === ds.stateId);

                  return (
                    <tr key={ds.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0F3D21' }}>{ds.name}</div>
                        <div style={{ fontSize: 11, color: '#0284C7', fontFamily: 'monospace' }}>{ds.code}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#334155' }}>
                        {whObj?.name || ds.warehouseId}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#047857' }}>
                        {stObj?.name || ds.stateId} ({stObj?.code})
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#475569' }}>
                        {ds.deliveryRadiusKm} km radius
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, backgroundColor: '#D1FAE5', color: '#047857', padding: '3px 8px', borderRadius: 4 }}>
                          {ds.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SELLER ONBOARDING & STATE-FILTERED WAREHOUSE SELECTION */}
      {activeTab === 'SELLERS' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
              Seller Onboarding & Supply Operations Setup
            </h3>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Workflow: Admin Approves Seller → Seller selects State → System displays <strong>only available Warehouses of that State</strong> → Seller selects preferred Warehouse.
            </div>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                  <th style={{ padding: '12px 16px' }}>Seller Business Details</th>
                  <th style={{ padding: '12px 16px' }}>Contact Info</th>
                  <th style={{ padding: '12px 16px' }}>Operational State</th>
                  <th style={{ padding: '12px 16px' }}>Connected Supply Warehouse</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((sel) => {
                  const stObj = states.find((s) => s.id === sel.stateId);
                  const whObj = warehouses.find((w) => w.id === sel.preferredWarehouseId);

                  return (
                    <tr key={sel.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 800, color: '#0F3D21' }}>{sel.businessName}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>Owner: {sel.ownerName}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155' }}>
                        <div>{sel.email}</div>
                        <div style={{ fontSize: 11, color: '#64748B' }}>{sel.phone}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: '#334155' }}>
                        {stObj?.name || sel.stateId} ({stObj?.code})
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: sel.preferredWarehouseId ? '#0284C7' : '#DC2626' }}>
                        {whObj ? whObj.name : 'Unassigned'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            backgroundColor: sel.approvalStatus === 'APPROVED' ? '#D1FAE5' : '#FEF3C7',
                            color: sel.approvalStatus === 'APPROVED' ? '#047857' : '#B45309',
                            padding: '3px 8px',
                            borderRadius: 4,
                          }}
                        >
                          {sel.approvalStatus}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSellerForOnboarding(sel);
                            setSellerTargetStateId(sel.stateId);
                            setSellerTargetWarehouseId(sel.preferredWarehouseId || '');
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: 'none',
                            backgroundColor: '#0F3D21',
                            color: '#F59E0B',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          Configure Supply Warehouse
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE STATE */}
      {isAddStateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <form onSubmit={handleAddState} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, maxWidth: 400, width: '100%', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F3D21', margin: 0 }}>Create Master State</h3>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>State Code *</label>
              <input type="text" required placeholder="e.g. KA, MH, DL" value={stateCode} onChange={(e) => setStateCode(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>State Name *</label>
              <input type="text" required placeholder="e.g. Karnataka" value={stateName} onChange={(e) => setStateName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setIsAddStateModal(false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 18px', borderRadius: 8, border: 'none', backgroundColor: '#0F3D21', color: '#F59E0B', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>Create State</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE ZONE UNDER STATE */}
      {isAddZoneModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <form onSubmit={handleAddZone} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, maxWidth: 440, width: '100%', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F3D21', margin: 0 }}>Add Zone under State</h3>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>Select State *</label>
              <select value={zoneStateId} onChange={(e) => setZoneStateId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}>
                {states.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>Zone Name *</label>
              <input type="text" required placeholder="e.g. Indiranagar Tech Hub Zone" value={zoneName} onChange={(e) => setZoneName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>City Name *</label>
              <input type="text" required placeholder="e.g. Bangalore" value={zoneCity} onChange={(e) => setZoneCity(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setIsAddZoneModal(false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 18px', borderRadius: 8, border: 'none', backgroundColor: '#0F3D21', color: '#F59E0B', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>Add Zone</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE WAREHOUSE (STATE -> ZONE -> WAREHOUSE) */}
      {isAddWarehouseModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <form onSubmit={handleAddWarehouse} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, maxWidth: 480, width: '100%', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F3D21', margin: 0 }}>Warehouse Setup (`State → Zone → Warehouse`)</h3>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>Select State *</label>
              <select
                value={whStateId}
                onChange={(e) => {
                  setWhStateId(e.target.value);
                  setWhZoneId('');
                }}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
              >
                {states.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>Select Zone (Filtered by State) *</label>
              <select value={whZoneId} required onChange={(e) => setWhZoneId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}>
                <option value="">-- Select Zone in Selected State --</option>
                {filteredZonesForWh.map((z) => (
                  <option key={z.id} value={z.id}>{z.name} ({z.cityName})</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>Code *</label>
                <input type="text" required placeholder="KA-WH-03" value={whCode} onChange={(e) => setWhCode(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>Warehouse Name *</label>
                <input type="text" required placeholder="Bangalore North Fulfillment Center" value={whName} onChange={(e) => setWhName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>Address</label>
              <input type="text" placeholder="Plot 12, Industrial Area" value={whAddress} onChange={(e) => setWhAddress(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>Capacity Units</label>
              <input type="number" value={whCapacity} onChange={(e) => setWhCapacity(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setIsAddWarehouseModal(false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 18px', borderRadius: 8, border: 'none', backgroundColor: '#0F3D21', color: '#F59E0B', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>Create Warehouse</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE DARK STORE UNDER WAREHOUSE */}
      {isAddDarkstoreModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <form onSubmit={handleAddDarkStore} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, maxWidth: 480, width: '100%', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F3D21', margin: 0 }}>Create Dark Store under Warehouse</h3>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>Select Parent Warehouse *</label>
              <select value={dsWarehouseId} onChange={(e) => setDsWarehouseId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>

            {/* Inherited State Banner */}
            <div style={{ backgroundColor: '#ECFDF5', padding: '10px 14px', borderRadius: 8, border: '1px solid #A7F3D0', fontSize: 12, color: '#047857', fontWeight: 700 }}>
              Rule Enforced: Inherited State is <strong>{parentStateForDs?.name} ({parentStateForDs?.code})</strong>. Dark Store cannot belong to a different state than its parent warehouse.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>Code *</label>
                <input type="text" required placeholder="KA-DS-03" value={dsCode} onChange={(e) => setDsCode(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>Dark Store Name *</label>
                <input type="text" required placeholder="Whitefield Quick-Commerce Darkstore" value={dsName} onChange={(e) => setDsName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>Delivery Radius (km)</label>
              <input type="number" step="0.5" value={dsRadius} onChange={(e) => setDsRadius(Number(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13 }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setIsAddDarkstoreModal(false)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 18px', borderRadius: 8, border: 'none', backgroundColor: '#0F3D21', color: '#F59E0B', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>Create Dark Store</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CONFIGURE SELLER SUPPLY WAREHOUSE */}
      {selectedSellerForOnboarding && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <form onSubmit={handleApproveSellerOnboarding} style={{ backgroundColor: '#FFFFFF', borderRadius: 16, maxWidth: 480, width: '100%', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F3D21', margin: 0 }}>Seller Onboarding & Supply Warehouse Mapping</h3>

            <div style={{ fontSize: 13, color: '#475569' }}>
              Configuring supply operations for <strong>{selectedSellerForOnboarding.businessName}</strong> ({selectedSellerForOnboarding.email}).
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>Select Seller State *</label>
              <select
                value={sellerTargetStateId}
                onChange={(e) => {
                  setSellerTargetStateId(e.target.value);
                  setSellerTargetWarehouseId('');
                }}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}
              >
                {states.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#0F3D21', marginBottom: 4 }}>Select Preferred Warehouse (Only Available in Selected State) *</label>
              <select value={sellerTargetWarehouseId} required onChange={(e) => setSellerTargetWarehouseId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700 }}>
                <option value="">-- Select State-Filtered Warehouse --</option>
                {filteredWarehousesForSeller.map((w) => (
                  <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setSelectedSellerForOnboarding(null)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1', backgroundColor: '#F8FAFC', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 18px', borderRadius: 8, border: 'none', backgroundColor: '#0F3D21', color: '#F59E0B', fontSize: 12, fontWeight: 900, cursor: 'pointer' }}>Approve & Connect Warehouse</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
