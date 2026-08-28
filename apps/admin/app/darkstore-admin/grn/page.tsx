'use client';

import React, { useState } from 'react';

export interface GrnEntryRecord {
  id: string;
  grnNumber: string;
  stateName: string;
  warehouseName: string;
  productName: string;
  sku: string;
  quantityReceived: number;
  entryDate: string;
  receivedBy: string;
}

const SAMPLE_STATES = [
  { id: 'st-ka', name: 'Karnataka' },
  { id: 'st-mh', name: 'Maharashtra' },
  { id: 'st-dl', name: 'Delhi NCR' },
];

const SAMPLE_WAREHOUSES = [
  { id: 'wh-ka-central', stateId: 'st-ka', name: 'Bangalore Central Mega Fulfillment Warehouse', code: 'KA-WH-CENTRAL-01' },
  { id: 'wh-ka-south', stateId: 'st-ka', name: 'South Bangalore Logistics Hub', code: 'KA-WH-SOUTH-02' },
  { id: 'wh-mh-mumbai', stateId: 'st-mh', name: 'Mumbai Metro Regional Warehouse', code: 'MH-WH-MUMBAI-01' },
];

const SAMPLE_PRODUCTS = [
  { sku: 'GRC-MLK-101', name: 'Organic Farm Fresh Whole Milk 1L', category: 'Dairy' },
  { sku: 'GRC-RCE-202', name: 'Basmati Premium Extra Long Grain Rice 5kg', category: 'Atta & Rice' },
  { sku: 'GRC-MNG-303', name: 'Fresh Alphonso Mangoes 1kg', category: 'Fruits' },
  { sku: 'GRC-OIL-404', name: 'Cold Pressed Mustard Oil 1L', category: 'Edible Oils' },
];

const INITIAL_GRN_LOGS: GrnEntryRecord[] = [
  {
    id: 'grn-801',
    grnNumber: 'GRN-2026-08-9901',
    stateName: 'Karnataka',
    warehouseName: 'Bangalore Central Mega Fulfillment Warehouse',
    productName: 'Organic Farm Fresh Whole Milk 1L',
    sku: 'GRC-MLK-101',
    quantityReceived: 500,
    entryDate: '2026-08-27 10:15',
    receivedBy: 'Warehouse Manager (Arun Kumar)',
  },
  {
    id: 'grn-802',
    grnNumber: 'GRN-2026-08-9902',
    stateName: 'Karnataka',
    warehouseName: 'South Bangalore Logistics Hub',
    productName: 'Basmati Premium Extra Long Grain Rice 5kg',
    sku: 'GRC-RCE-202',
    quantityReceived: 350,
    entryDate: '2026-08-26 14:30',
    receivedBy: 'Inward Supervisor (Rohan Sharma)',
  },
];

export default function WarehouseGrnPage() {
  const [grnLogs, setGrnLogs] = useState<GrnEntryRecord[]>(INITIAL_GRN_LOGS);

  // Form State
  const [selectedStateId, setSelectedStateId] = useState('st-ka');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('wh-ka-central');
  const [selectedSku, setSelectedSku] = useState('GRC-MLK-101');
  const [quantityReceived, setQuantityReceived] = useState(500);

  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const filteredWarehouses = SAMPLE_WAREHOUSES.filter((w) => w.stateId === selectedStateId);

  const handleSubmitGrn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseId || !selectedSku || quantityReceived <= 0) return;

    const stateObj = SAMPLE_STATES.find((s) => s.id === selectedStateId);
    const whObj = SAMPLE_WAREHOUSES.find((w) => w.id === selectedWarehouseId);
    const prodObj = SAMPLE_PRODUCTS.find((p) => p.sku === selectedSku);

    const newGrnNumber = `GRN-2026-08-${9900 + grnLogs.length + 1}`;
    const newRecord: GrnEntryRecord = {
      id: `grn-${Date.now()}`,
      grnNumber: newGrnNumber,
      stateName: stateObj?.name || selectedStateId,
      warehouseName: whObj?.name || selectedWarehouseId,
      productName: prodObj?.name || selectedSku,
      sku: selectedSku,
      quantityReceived: Number(quantityReceived),
      entryDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      receivedBy: 'Admin Inward Entry',
    };

    setGrnLogs((prev) => [newRecord, ...prev]);
    showToast(`GRN Entry ${newGrnNumber} submitted successfully! Warehouse stock updated by +${quantityReceived} units.`);
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
          Warehouse Inventory Flow (GRN / Stock Entry)
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Warehouse receives actual inventory through Goods Received Note (GRN) entries. Only GRN received quantity becomes actual Warehouse inventory stock.
        </p>
      </div>

      {/* GRN Entry Form Card */}
      <form
        onSubmit={handleSubmitGrn}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          padding: 24,
          border: '1.5px solid #0F3D21',
          boxShadow: '0 4px 14px rgba(15, 61, 33, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
          Admin GRN Stock Inward Entry Form
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {/* 1. Select State */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#0F3D21', marginBottom: 6 }}>
              1. Select State *
            </label>
            <select
              value={selectedStateId}
              onChange={(e) => {
                setSelectedStateId(e.target.value);
                const firstWh = SAMPLE_WAREHOUSES.find((w) => w.stateId === e.target.value);
                if (firstWh) setSelectedWarehouseId(firstWh.id);
              }}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, outline: 'none' }}
            >
              {SAMPLE_STATES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Select Warehouse (Filtered by State) */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#0F3D21', marginBottom: 6 }}>
              2. Select Warehouse (State Filtered) *
            </label>
            <select
              value={selectedWarehouseId}
              required
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, outline: 'none' }}
            >
              {filteredWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Product / Variant */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#0F3D21', marginBottom: 6 }}>
              3. Product / Variant SKU *
            </label>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 700, outline: 'none' }}
            >
              {SAMPLE_PRODUCTS.map((p) => (
                <option key={p.sku} value={p.sku}>
                  {p.name} [{p.category}]
                </option>
              ))}
            </select>
          </div>

          {/* 4. Quantity Received */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#0F3D21', marginBottom: 6 }}>
              4. Quantity Received through GRN *
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantityReceived}
              onChange={(e) => setQuantityReceived(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, fontWeight: 800 }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: '#0F3D21',
              color: '#F59E0B',
              fontSize: 14,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15, 61, 33, 0.2)',
            }}
          >
            Submit GRN & Update Warehouse Inventory
          </button>
        </div>
      </form>

      {/* GRN Log History Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 14, border: '1px solid #E2E8F0', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
            GRN Inward Stock Log History
          </h3>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
            Flow: Warehouse GRN Entry → Warehouse Inventory Updated → Available Darkstore Stock Recalculated
          </div>
        </div>

        <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 10 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>
                <th style={{ padding: '12px 16px' }}>GRN Reference Number</th>
                <th style={{ padding: '12px 16px' }}>State & Warehouse</th>
                <th style={{ padding: '12px 16px' }}>Product Variant</th>
                <th style={{ padding: '12px 16px' }}>Received Quantity</th>
                <th style={{ padding: '12px 16px' }}>Entry Date</th>
                <th style={{ padding: '12px 16px' }}>Received By</th>
              </tr>
            </thead>
            <tbody>
              {grnLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 900, color: '#0284C7', fontFamily: 'monospace' }}>
                    {log.grnNumber}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 800, color: '#0F3D21' }}>{log.warehouseName}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>State: {log.stateName}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#1E293B' }}>{log.productName}</div>
                    <div style={{ fontSize: 11, color: '#0284C7', fontFamily: 'monospace' }}>{log.sku}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#047857', backgroundColor: '#D1FAE5', padding: '4px 10px', borderRadius: 6 }}>
                      +{log.quantityReceived} units
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#475569' }}>{log.entryDate}</td>
                  <td style={{ padding: '12px 16px', color: '#64748B' }}>{log.receivedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
