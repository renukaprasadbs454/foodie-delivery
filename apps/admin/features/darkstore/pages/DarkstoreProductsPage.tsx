'use client';

import React, { useState } from 'react';
import type { DarkstoreProduct } from '../types';

export function DarkstoreProductsPage() {
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
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Dairy & Eggs');
  const [newPrice, setNewPrice] = useState(40);
  const [newSellingPrice, setNewSellingPrice] = useState(38);
  const [newShelf, setNewShelf] = useState('Shelf B-02');

  const handleAddProduct = () => {
    if (!newSku || !newName) return;
    const newP: DarkstoreProduct = {
      id: `dp-${Date.now()}`,
      darkstoreId: 'd0000000-0000-0000-0000-000000000001',
      sku: newSku,
      name: newName,
      category: newCategory,
      price: Number(newPrice),
      sellingPrice: Number(newSellingPrice),
      currentStock: 20,
      reservedStock: 0,
      availableStock: 20,
      minThreshold: 10,
      unit: 'pcs',
      taxPercent: 5,
      shelfLocation: newShelf,
      status: 'ACTIVE',
      isLowStock: false,
      isOutOfStock: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts([newP, ...products]);
    setShowAddModal(false);
    setNewSku('');
    setNewName('');
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
             Darkstore Product Catalog Management
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
            Catalog items, pricing, GST %, units, and rack shelf locations assigned to Indiranagar QuickHub.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{ backgroundColor: '#0F3D21', color: '#FFFFFF', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer' }}
        >
          + Add Darkstore Product
        </button>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '2px solid #E5E7EB', color: '#374151', fontWeight: 700 }}>
              <th style={{ padding: '14px 16px' }}>SKU</th>
              <th style={{ padding: '14px 16px' }}>Product</th>
              <th style={{ padding: '14px 16px' }}>Category</th>
              <th style={{ padding: '14px 16px' }}>MRP / Selling Price</th>
              <th style={{ padding: '14px 16px' }}>Shelf Bin Location</th>
              <th style={{ padding: '14px 16px' }}>Stock</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0F3D21' }}>{p.sku}</td>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#111827' }}>{p.name}</td>
                <td style={{ padding: '14px 16px', color: '#4B5563' }}>{p.category}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ textDecoration: 'line-through', color: '#9CA3AF', marginRight: 6 }}>₹{p.price.toFixed(2)}</span>
                  <span style={{ fontWeight: 800, color: '#0F3D21' }}>₹{p.sellingPrice.toFixed(2)}</span>
                </td>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#F59E0B' }}> {p.shelfLocation}</td>
                <td style={{ padding: '14px 16px', fontWeight: 800, color: '#111827' }}>{p.currentStock} {p.unit}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 800, backgroundColor: '#DCFCE7', color: '#15803D' }}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 24, maxWidth: 500, width: '100%' }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F3D21', margin: '0 0 16px' }}>
              Add Product to Darkstore Catalog
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <input type="text" placeholder="SKU (e.g. MILK-AMUL-500ML)" value={newSku} onChange={(e) => setNewSku(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
              <input type="text" placeholder="Product Name" value={newName} onChange={(e) => setNewName(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
              <input type="text" placeholder="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input type="number" placeholder="MRP Price" value={newPrice} onChange={(e) => setNewPrice(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
                <input type="number" placeholder="Selling Price" value={newSellingPrice} onChange={(e) => setNewSellingPrice(Number(e.target.value))} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
              </div>
              <input type="text" placeholder="Rack / Shelf Bin Location (e.g. Shelf A-04)" value={newShelf} onChange={(e) => setNewShelf(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #D1D5DB' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ backgroundColor: '#F3F4F6', color: '#374151', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>Cancel</button>
              <button type="button" onClick={handleAddProduct} style={{ backgroundColor: '#0F3D21', color: '#FFFFFF', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 800 }}>Save Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
