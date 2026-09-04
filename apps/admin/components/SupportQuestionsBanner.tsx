'use client';

import React, { useState } from 'react';

export function SupportQuestionsBanner() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [meetingDate, setMeetingDate] = useState('2025-08-15');
  const [topic, setTopic] = useState('Vendor Onboarding & Commission Strategy');
  const [booked, setBooked] = useState(false);

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    setBooked(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setBooked(false);
      setName('');
      setEmail('');
    }, 2000);
  };

  return (
    <div style={{ position: 'relative', marginTop: 28, marginBottom: 28 }}>
      {/* Banner Container */}
      <div
        style={{
          backgroundColor: '#0F3D21',
          backgroundImage: 'linear-gradient(135deg, #0F3D21 0%, #047857 100%)',
          borderRadius: 20,
          padding: '36px 44px',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 24,
          boxShadow: '0 10px 25px rgba(15, 61, 33, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left Text & CTA */}
        <div style={{ maxWidth: 520, zIndex: 2 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
            Still Have <span style={{ color: '#F59E0B' }}>Questions?</span>
          </h2>
          <p style={{ fontSize: 15, color: '#A7F3D0', marginTop: 12, lineHeight: 1.6 }}>
            Book a meeting with our Foodie marketplace operations specialists and discuss your queries.
          </p>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              marginTop: 20,
              padding: '12px 28px',
              backgroundColor: '#FFFFFF',
              color: '#0F3D21',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Book Now
          </button>
        </div>

        {/* Right Graphic Illustration */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            padding: '20px 28px',
            borderRadius: 16,
            border: '1px solid rgba(255, 255, 255, 0.15)',
            zIndex: 2,
          }}
        >
          <div style={{ fontSize: 48 }}></div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FEF3C7' }}>1-on-1 Operations Call</div>
            <div style={{ fontSize: 12, color: '#E6F4EA', marginTop: 4 }}>30-min strategy session with Foodie experts</div>
          </div>
        </div>

        {/* Floating Side Tab: Upcoming Features */}
        <button
          type="button"
          onClick={() => setIsRoadmapOpen(true)}
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%) rotate(-90deg)',
            transformOrigin: 'bottom right',
            backgroundColor: '#DCFCE7',
            color: '#14532D',
            padding: '8px 16px',
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            border: '1px solid #86EFAC',
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            zIndex: 3,
            boxShadow: '0 -4px 10px rgba(0,0,0,0.1)',
          }}
        >
          Upcoming Features
        </button>
      </div>

      {/* Book Meeting Modal */}
      {isModalOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 480,
              width: '100%',
              padding: 28,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
                 Schedule Foodie Operations Consultation
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B' }}
              >
                
              </button>
            </div>

            {booked ? (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 48 }}></div>
                <h4 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', marginTop: 12 }}>
                  Meeting Successfully Booked!
                </h4>
                <p style={{ fontSize: 13, color: '#64748B' }}>
                  A calendar invite has been dispatched to {email || 'your email'}. Our specialist looks forward to speaking with you!
                </p>
              </div>
            ) : (
              <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', marginTop: 4, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Business Email</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. alex@foodie.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', marginTop: 4, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Preferred Consultation Date</label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', marginTop: 4, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Discussion Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', marginTop: 4, outline: 'none' }}
                  >
                    <option>Vendor Onboarding & Commission Strategy</option>
                    <option>Delivery Fleet Logistics & Dynamic Surge Pricing</option>
                    <option>Food Quality Moderation & Customer Review Policies</option>
                    <option>Promo Campaign Vouchers & Marketing Growth</option>
                  </select>
                </div>
                <button
                  type="submit"
                  style={{
                    marginTop: 10,
                    padding: '12px',
                    backgroundColor: '#14532D',
                    color: '#F59E0B',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Confirm Booking 
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {/* Upcoming Features Drawer */}
      {isRoadmapOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setIsRoadmapOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#FFFFFF',
              height: '100%',
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
                 Upcoming Foodie Features Roadmap
              </h3>
              <button
                type="button"
                onClick={() => setIsRoadmapOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B' }}
              >
                
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { title: ' AI Multilingual Order Voice Bot', status: 'Q4 2025', desc: 'Allows customers to speak complex food orders directly in native languages.' },
                { title: ' Autonomous Drone Delivery Dispatch', status: 'Q1 2026', desc: 'Integration with automated aerial food delivery route planners.' },
                { title: ' Thermal Kitchen Heatmap Analytics', status: 'In Progress', desc: 'Real-time kitchen prep bottle-neck diagnostics for cloud kitchens.' },
              ].map((f) => (
                <div key={f.title} style={{ padding: 14, borderRadius: 10, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#14532D' }}>{f.title}</div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#D97706', backgroundColor: '#FEF3C7', padding: '2px 6px', borderRadius: 4 }}>{f.status}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
