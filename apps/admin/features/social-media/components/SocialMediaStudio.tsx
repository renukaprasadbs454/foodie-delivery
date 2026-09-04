'use client';

import React, { useState } from 'react';
import type { SocialMediaLink, SocialMediaStatus } from '../types/socialMediaTypes';
import { SOCIAL_MEDIA_OPTIONS } from '../types/socialMediaTypes';

const INITIAL_LINKS: SocialMediaLink[] = [
  {
    id: 'sm-1',
    sl: 1,
    name: 'pinterest',
    link: 'https://www.pinterest.com/login/',
    status: 'ACTIVE',
  },
  {
    id: 'sm-2',
    sl: 2,
    name: 'linkedin',
    link: 'https://www.linkedin.com',
    status: 'ACTIVE',
  },
  {
    id: 'sm-3',
    sl: 3,
    name: 'facebook',
    link: 'https://www.facebook.com/',
    status: 'ACTIVE',
  },
];

const PLATFORM_ICONS: Record<string, string> = {
  pinterest: '',
  linkedin: '',
  facebook: '',
  instagram: '',
  youtube: '▶',
  twitter: '',
  tiktok: '',
};

export function SocialMediaStudio() {
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>(INITIAL_LINKS);
  const [selectedName, setSelectedName] = useState<string>('');
  const [inputLink, setInputLink] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleReset = () => {
    setSelectedName('');
    setInputLink('');
    setEditingId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedName) {
      alert('Please select a Social Media Name');
      return;
    }
    if (!inputLink.trim()) {
      alert('Please enter a valid Social Media Link');
      return;
    }

    if (editingId) {
      setSocialLinks((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, name: selectedName, link: inputLink.trim() }
            : item
        )
      );
      showToast(`Updated social media link for ${selectedName}`);
    } else {
      const newEntry: SocialMediaLink = {
        id: `sm-${Date.now()}`,
        sl: socialLinks.length + 1,
        name: selectedName,
        link: inputLink.trim(),
        status: 'ACTIVE',
      };
      setSocialLinks((prev) => [...prev, newEntry]);
      showToast(`Added ${selectedName} social media link`);
    }

    handleReset();
  };

  const handleToggleStatus = (id: string) => {
    setSocialLinks((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus: SocialMediaStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
    showToast('Social media link status updated');
  };

  const handleEdit = (item: SocialMediaLink) => {
    setEditingId(item.id);
    setSelectedName(item.name);
    setInputLink(item.link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1180, margin: '0 auto' }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            backgroundColor: '#14532D',
            color: '#F59E0B',
            padding: '12px 24px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            boxShadow: '0 10px 30px rgba(20, 83, 45, 0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span></span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}></span>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#14532D', margin: 0 }}>
              Social Media
            </h1>
          </div>
          <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 0 36px' }}>
            Configure official social media links, customer channel URLs, and active display toggles
          </p>
        </div>
      </div>

      {/* Form Card */}
      <form
        onSubmit={handleSave}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1.5px solid #14532D',
          padding: '24px 28px',
          boxShadow: '0 4px 16px rgba(20, 83, 45, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Social Media Name Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#14532D' }}>
              Social Media Name
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedName}
                onChange={(e) => setSelectedName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 500,
                  color: selectedName ? '#0F172A' : '#94A3B8',
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                }}
              >
                <option value="">---Select---</option>
                {SOCIAL_MEDIA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} style={{ color: '#0F172A' }}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#14532D', fontSize: 12 }}>
                ▼
              </span>
            </div>
          </div>

          {/* Social Media Link Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#14532D' }}>
              Social Media Link
            </label>
            <input
              type="url"
              placeholder="Enter Social Media Link"
              value={inputLink}
              onChange={(e) => setInputLink(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontSize: 14,
                color: '#0F172A',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 14, marginTop: 4 }}>
          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '10px 24px',
              backgroundColor: '#E2E8F0',
              color: '#475569',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Reset
          </button>
          <button
            type="submit"
            style={{
              padding: '10px 36px',
              backgroundColor: '#14532D',
              color: '#F59E0B',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(20, 83, 45, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            {editingId ? 'Update' : 'Save'}
          </button>
        </div>
      </form>

      {/* Table Card */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', color: '#14532D', fontSize: 13, borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '16px 24px', fontWeight: 800, width: 80 }}>SL</th>
                <th style={{ padding: '16px 24px', fontWeight: 800, width: 220 }}>Name</th>
                <th style={{ padding: '16px 24px', fontWeight: 800 }}>Link</th>
                <th style={{ padding: '16px 24px', fontWeight: 800, width: 140 }}>Status</th>
                <th style={{ padding: '16px 24px', fontWeight: 800, width: 120 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {socialLinks.map((item, index) => {
                const isActive = item.status === 'ACTIVE';
                const isEditingThis = editingId === item.id;
                const icon = PLATFORM_ICONS[item.name.toLowerCase()] || '';

                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      backgroundColor: isEditingThis ? '#FEF3C7' : 'transparent',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '18px 24px', color: '#64748B', fontWeight: 600 }}>
                      {index + 1}
                    </td>

                    <td style={{ padding: '18px 24px', color: '#0F172A', fontWeight: 700 }}>
                      <span style={{ marginRight: 8 }}>{icon}</span>
                      <span>{item.name}</span>
                    </td>

                    <td style={{ padding: '18px 24px' }}>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#14532D', fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}
                      >
                        {item.link}
                      </a>
                    </td>

                    {/* Toggle Switch in #14532D and #F59E0B */}
                    <td style={{ padding: '18px 24px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item.id)}
                        aria-label={`Toggle ${item.name} status`}
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: isActive ? '#14532D' : '#CBD5E1',
                          border: 'none',
                          padding: 2,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isActive ? 'flex-end' : 'flex-start',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: isActive ? '#F59E0B' : '#FFFFFF',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }}
                        />
                      </button>
                    </td>

                    {/* Pencil Edit Action */}
                    <td style={{ padding: '18px 24px' }}>
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        title="Edit Social Media Link"
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          border: '1.5px solid #14532D',
                          backgroundColor: isEditingThis ? '#FEF3C7' : '#FFFFFF',
                          color: '#14532D',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: 14,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
