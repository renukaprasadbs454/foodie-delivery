'use client';

import React, { useState } from 'react';

export function DarkstoreReportsPage() {
  const [dateRange, setDateRange] = useState('TODAY');

  const exportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Date,Orders,Revenue,AvgPickTime,AvgPackTime,StockOutCount\n' +
      '2026-08-26,10,167.00,3.2m,1.8m,1\n';
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `darkstore_report_${dateRange.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F3D21', margin: 0 }}>
             Darkstore Operational Reports & Analytics
          </h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>
            Metrics on picking velocity, packing efficiency, dispatch turnarounds, and stock-out frequency.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #D1D5DB', fontSize: 13 }}
          >
            <option value="TODAY">Today (26 Aug)</option>
            <option value="WEEK">This Week</option>
            <option value="MONTH">This Month</option>
          </select>

          <button
            type="button"
            onClick={exportCSV}
            style={{ backgroundColor: '#0F3D21', color: '#FFFFFF', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 800, border: 'none', cursor: 'pointer' }}
          >
            Export CSV 
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>AVG PICK TIME / ORDER</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0F3D21', marginTop: 4 }}>3.2 mins</div>
          <div style={{ fontSize: 11, color: '#15803D', marginTop: 4 }}> Sub 5-min target met</div>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>AVG PACK TIME / ORDER</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0F3D21', marginTop: 4 }}>1.8 mins</div>
          <div style={{ fontSize: 11, color: '#15803D', marginTop: 4 }}> Sub 2-min target met</div>
        </div>
        <div style={{ backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280' }}>DISPATCH PREP SLA</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0F3D21', marginTop: 4 }}>98.4%</div>
          <div style={{ fontSize: 11, color: '#15803D', marginTop: 4 }}> 10-min store exit SLA</div>
        </div>
      </div>

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, border: '1px solid #E5E7EB' }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0F3D21', margin: '0 0 16px' }}>
          Top Selling Darkstore Products Today
        </h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <li style={{ padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <div><strong>1. Amul Taaza Toned Fresh Milk 500ml</strong> (SKU: MILK-AMUL-500ML)</div>
            <div style={{ fontWeight: 800, color: '#0F3D21' }}>42 units sold</div>
          </li>
          <li style={{ padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <div><strong>2. Coca-Cola Zero Sugar Can 330ml</strong> (SKU: COKE-ZERO-330ML)</div>
            <div style={{ fontWeight: 800, color: '#0F3D21' }}>28 units sold</div>
          </li>
          <li style={{ padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <div><strong>3. Britannia Brown Bread Whole Wheat 400g</strong> (SKU: BREAD-BRIT-400G)</div>
            <div style={{ fontWeight: 800, color: '#0F3D21' }}>18 units sold</div>
          </li>
        </ul>
      </div>
    </div>
  );
}
