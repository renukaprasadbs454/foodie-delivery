'use client';

import React, { useState } from 'react';
import type { DarkstoreProduct } from '../types';

export function DarkstoreInventoryPage() {
  const [search, setSearch] = useState<string>('');
  const [stockFilter, setStockFilter] = useState<string>('ALL');
  const [adjustingProduct, setAdjustingProduct] = useState<DarkstoreProduct | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('Stock In - New Shipment Arrival');

  const [products, setProducts] = useState<DarkstoreProduct[]>([
    {
      id: 'dp111111-0000-0000-0000-000000000001',
      darkstoreId: 'd0000000-0000-0000-0000-000000000001',
      sku: 'MILK-AMUL-500ML',
      name: 'Amul Taaza Toned Fresh Milk 500ml',
      category: 'Dairy & Eggs',
      imageUrl: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300',
      price: 30.0,
      sellingPrice: 28.0,
      currentStock: 85,
      reservedStock: 5,
      availableStock: 80,
      minThreshold: 15,
      unit: 'pack',
      taxPercent: 5.0,
      shelfLocation: 'Shelf A-01 (Cooler)',
      status: 'ACTIVE',
      isLowStock: false,
      isOutOfStock: false,
      createdAt: '2026-08-26T12:00:00Z',
      updatedAt: '2026-08-26T12:00:00Z',
    },
    {
      id: 'dp222222-0000-0000-0000-000000000002',
      darkstoreId: 'd0000000-0000-0000-0000-000000000001',
      sku: 'BREAD-BRIT-400G',
      name: 'Britannia Brown Bread Whole Wheat 400g',
      category: 'Bakery & Bread',
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300',
      price: 50.0,
      sellingPrice: 45.0,
      currentStock: 6,
      reservedStock: 2,
      availableStock: 4,
      minThreshold: 10,
      unit: 'pack',
      taxPercent: 5.0,
      shelfLocation: 'Shelf A-12',
      status: 'ACTIVE',
      isLowStock: true,
      isOutOfStock: false,
      createdAt: '2026-08-26T12:00:00Z',
      updatedAt: '2026-08-26T12:00:00Z',
    },
    {
      id: 'dp333333-0000-0000-0000-000000000003',
      darkstoreId: 'd0000000-0000-0000-0000-000000000001',
      sku: 'CHIPS-LAYS-MAGIC-50G',
      name: 'Lays India Magic Masala Chips 50g',
      category: 'Snacks & Munchies',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300',
      price: 20.0,
      sellingPrice: 20.0,
      currentStock: 0,
      reservedStock: 0,
      availableStock: 0,
      minThreshold: 12,
      unit: 'pcs',
      taxPercent: 12.0,
      shelfLocation: 'Shelf B-04',
      status: 'ACTIVE',
      isLowStock: false,
      isOutOfStock: true,
      createdAt: '2026-08-26T12:00:00Z',
      updatedAt: '2026-08-26T12:00:00Z',
    },
  ]);

  const handleApplyStockAdjustment = () => {
    if (!adjustingProduct) return;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === adjustingProduct.id) {
          const nextStock = Math.max(0, p.currentStock + stockDelta);
          const nextAvail = Math.max(0, nextStock - p.reservedStock);
          return {
            ...p,
            currentStock: nextStock,
            availableStock: nextAvail,
            isLowStock: nextStock > 0 && nextStock <= p.minThreshold,
            isOutOfStock: nextStock <= 0,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );
    setAdjustingProduct(null);
  };

  const filteredProducts = products.filter((p) => {
    if (stockFilter === 'LOW' && !p.isLowStock) return false;
    if (stockFilter === 'OUT' && !p.isOutOfStock) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.shelfLocation.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
           Darkstore Inventory Management
        </h1>
        <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
          Real-time stock control, bin location mapping, reserved stock tracking, and stock-in/stock-out adjustments.
        </p>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: 16,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          marginBottom: 20,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <input
          type="text"
          placeholder="Search by SKU, Product Name, Shelf Bin Location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13, minWidth: 320 }}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          {['ALL', 'LOW', 'OUT'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStockFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 800,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: stockFilter === st ? '#0F3D21' : '#F3F4F6',
                color: stockFilter === st ? '#FFFFFF' : '#374151',
              }}
            >
              {st === 'ALL' ? 'All Stock' : st === 'LOW' ? ' Low Stock' : ' Out of Stock'}
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB', color: '#374151', fontWeight: 700 }}>
              <th style={{ padding: '14px 16px' }}>SKU</th>
              <th style={{ padding: '14px 16px' }}>Product Name</th>
              <th style={{ padding: '14px 16px' }}>Category</th>
              <th style={{ padding: '14px 16px' }}>Shelf Location</th>
              <th style={{ padding: '14px 16px' }}>Total Stock</th>
              <th style={{ padding: '14px 16px' }}>Reserved</th>
              <th style={{ padding: '14px 16px' }}>Available</th>
              <th style={{ padding: '14px 16px' }}>Min Threshold</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F3D21' }}>{p.sku}</td>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#111827' }}>{p.name}</td>
                <td style={{ padding: '14px 16px', color: '#4B5563' }}>{p.category}</td>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#F59E0B' }}> {p.shelfLocation}</td>
                <td style={{ padding: '14px 16px', fontWeight: 900, color: '#111827' }}>{p.currentStock} {p.unit}</td>
                <td style={{ padding: '14px 16px', color: '#D97706' }}>{p.reservedStock}</td>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#15803D' }}>{p.availableStock}</td>
                <td style={{ padding: '14px 16px', color: '#6B7280' }}>{p.minThreshold}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 800,
                      backgroundColor: p.isOutOfStock ? '#FEE2E2' : p.isLowStock ? '#FFEDD5' : '#DCFCE7',
                      color: p.isOutOfStock ? '#991B1B' : p.isLowStock ? '#C2410C' : '#15803D',
                    }}
                  >
                    {p.isOutOfStock ? 'OUT OF STOCK' : p.isLowStock ? 'LOW STOCK' : 'IN STOCK'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAdjustingProduct(p);
                      setStockDelta(10);
                    }}
                    style={{
                      backgroundColor: '#0F3D21',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Stock Adjust 
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, maxWidth: 500, width: '100%' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F3D21', margin: '0 0 12px' }}>
              Stock Adjustment — {adjustingProduct.name}
            </h2>
            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
              SKU: {adjustingProduct.sku} | Current Stock: <strong>{adjustingProduct.currentStock} {adjustingProduct.unit}</strong>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Adjustment Quantity (+ for Stock In, - for Stock Out):
              </label>
              <input
                type="number"
                value={stockDelta}
                onChange={(e) => setStockDelta(Number(e.target.value))}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 14, fontWeight: 700 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Reason for Stock Adjustment:
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                onClick={() => setAdjustingProduct(null)}
                style={{ backgroundColor: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyStockAdjustment}
                style={{ backgroundColor: '#0F3D21', color: '#FFFFFF', border: 'none', padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                Confirm & Log Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
