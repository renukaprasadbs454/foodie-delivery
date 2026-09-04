'use client';

import React, { useState } from 'react';

export function DarkstorePackingPage() {
  const [orderNumber] = useState('FD-10234');
  const [assignedPacker] = useState('Pooja Nair');
  const [bagCount, setBagCount] = useState<number>(1);
  const [sealTag, setSealTag] = useState<string>('SEAL-8839');
  const [isPacked, setIsPacked] = useState<boolean>(false);

  const items = [
    { name: 'Amul Taaza Toned Fresh Milk 500ml', qty: 2, status: 'PICKED' },
    { name: 'Britannia Brown Bread Whole Wheat 400g', qty: 1, status: 'PICKED' },
    { name: 'Coca-Cola Zero Sugar Can 330ml', qty: 2, status: 'PICKED' },
    { name: "Lay's India's Magic Masala Chips 50g", qty: 3, status: 'PICKED' },
    { name: 'Epigamia Greek Yogurt Natural 85g', qty: 2, status: 'PICKED' },
    { name: 'Ferrero Rocher Premium Chocolate Box 16 Pcs', qty: 1, status: 'PICKED' },
    { name: 'Fortune Sunlite Refined Sunflower Oil 1L', qty: 1, status: 'PICKED' },
  ];

  const handleCompletePacking = () => {
    setIsPacked(true);
  };

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
           Packing Station
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
          Active Packing Order: <strong style={{ color: '#0F3D21' }}>{orderNumber}</strong> | Assigned Packer: <strong>{assignedPacker}</strong>
        </p>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 16px' }}>
          Item Packing Verification Checklist
        </h2>

        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((it, idx) => (
            <li key={idx} style={{ padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
              <div>
                <span style={{ fontWeight: 800, color: '#0F3D21' }}> {it.name}</span>
                <span style={{ fontSize: 11, color: '#6B7280', marginLeft: 8 }}>Qty: {it.qty}</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#15803D', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: 6 }}>
                VERIFIED
              </span>
            </li>
          ))}
        </ul>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Number of Packing Bags:
            </label>
            <select
              value={bagCount}
              onChange={(e) => setBagCount(Number(e.target.value))}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }}
            >
              <option value={1}>1 Eco-Bag</option>
              <option value={2}>2 Eco-Bags</option>
              <option value={3}>3 Eco-Bags</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
              Tamper-Evident Bag Seal Tag #:
            </label>
            <input
              type="text"
              value={sealTag}
              onChange={(e) => setSealTag(e.target.value)}
              placeholder="e.g. SEAL-9901"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }}
            />
          </div>
        </div>

        {!isPacked ? (
          <button
            type="button"
            onClick={handleCompletePacking}
            style={{
              width: '100%',
              backgroundColor: '#0F3D21',
              color: '#FFFFFF',
              border: 'none',
              padding: '14px',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Seal Bag & Mark Ready for Dispatch 
          </button>
        ) : (
          <div style={{ backgroundColor: '#DCFCE7', color: '#15803D', padding: 16, borderRadius: 8, textAlign: 'center', fontWeight: 800 }}>
             Order {orderNumber} sealed with tag #{sealTag} ({bagCount} bag). Transferred to Dispatch Bay!
          </div>
        )}
      </div>
    </div>
  );
}
