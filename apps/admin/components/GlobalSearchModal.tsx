'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  category: 'Order' | 'Restaurant' | 'Delivery Partner' | 'Coupon';
  title: string;
  subtitle: string;
  url: string;
  icon: string;
}

const MOCK_SEARCH_ITEMS: SearchResult[] = [
  { id: '1', category: 'Order', title: 'Order #ORD-9821', subtitle: 'Customer: Sarah Jenkins • $42.50 • Delivered', url: '/orders', icon: '' },
  { id: '2', category: 'Order', title: 'Order #ORD-9820', subtitle: 'Customer: Mike Ross • $18.90 • Pending', url: '/orders', icon: '' },
  { id: '3', category: 'Restaurant', title: 'The Gourmet Kitchen', subtitle: 'Italian & Continental • Rating 4.8 • Active', url: '/restaurants', icon: '' },
  { id: '4', category: 'Restaurant', title: 'Spice Garden India', subtitle: 'Indian Cuisine • Rating 4.6 • Active', url: '/restaurants', icon: '' },
  { id: '5', category: 'Delivery Partner', title: 'David Miller', subtitle: 'Vehicle: Scooter • Status: On-Duty (Active)', url: '/delivery-partners', icon: '' },
  { id: '6', category: 'Delivery Partner', title: 'Elena Vance', subtitle: 'Vehicle: Bicycle • Status: Pending KYC', url: '/delivery-partners', icon: '' },
  { id: '7', category: 'Coupon', title: 'FLAT50OFF', subtitle: '50% OFF up to $15 • Usage: 1,420 / 2,000', url: '/coupons', icon: '' },
  { id: '8', category: 'Coupon', title: 'FREESHIP2026', subtitle: 'Free Delivery on orders above $30', url: '/coupons', icon: '' },
];

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = query.trim() === ''
    ? MOCK_SEARCH_ITEMS
    : MOCK_SEARCH_ITEMS.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      );

  const handleSelect = (url: string) => {
    router.push(url);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '100px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #E2E8F0', gap: 12 }}>
          <span style={{ fontSize: 18, color: '#64748B' }}></span>
          <input
            type="text"
            autoFocus
            placeholder="Search orders, restaurants, delivery partners, coupons..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 15,
              fontWeight: 500,
              color: '#0F172A',
              backgroundColor: 'transparent',
            }}
          />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: 6 }}>
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '12px 8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748B', fontSize: 14 }}>
              No results matching &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item.url)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 16px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #DCFCE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#14532D' }}>{item.title}</span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#D97706',
                        backgroundColor: '#FEF3C7',
                        padding: '2px 6px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                      }}
                    >
                      {item.category}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{item.subtitle}</div>
                </div>
                <span style={{ fontSize: 16, color: '#CBD5E1' }}></span>
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div style={{ padding: '10px 20px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#64748B' }}>
          <span>Search Admin Console items</span>
          <span style={{ display: 'flex', gap: 12 }}>
            <span><strong>↑↓</strong> Navigate</span>
            <span><strong>↵</strong> Select</span>
          </span>
        </div>
      </div>
    </div>
  );
}
