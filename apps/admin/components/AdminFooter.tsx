'use client';

import React, { useState } from 'react';

export function AdminFooter() {
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMsg, setTicketMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setIsTicketModalOpen(false);
      setSubmitted(false);
      setTicketSubject('');
      setTicketMsg('');
    }, 2000);
  };

  return (
    <footer
      style={{
        width: '100%',
        boxSizing: 'border-box',
        backgroundColor: '#1C2A22',
        color: '#CBD5E1',
        padding: '56px 48px 36px 48px',
        marginTop: 0,
        borderRadius: 0,
        borderTop: '4px solid #10B981',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 0.9fr 1.1fr 1fr 1.2fr',
          gap: 32,
          marginBottom: 44,
        }}
      >
        {/* Brand Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingRight: 16 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.5px' }}>
            <span style={{ backgroundColor: '#10B981', color: '#FFFFFF', borderRadius: 8, padding: '4px 8px', fontSize: 18 }}></span>
            <span>Foodie Admin</span>
          </div>
          <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6, margin: 0 }}>
            The hyperlocal multi-vendor marketplace platform for food delivery, fine dining, bakeries, cafes, and cloud kitchens.
          </p>
          <button
            type="button"
            onClick={() => setIsTicketModalOpen(true)}
            style={{
              marginTop: 4,
              padding: '10px 22px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              alignSelf: 'flex-start',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            Support Ticket
          </button>
        </div>

        {/* Product Column */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#F1F5F9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 18 }}>
            PRODUCT
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
            <li><a href="#" style={{ color: '#CBD5E1', textDecoration: 'none', transition: 'color 0.15s' }}>Features</a></li>
            <li><a href="#" style={{ color: '#CBD5E1', textDecoration: 'none', transition: 'color 0.15s' }}>Pricing</a></li>
            <li><a href="#" style={{ color: '#CBD5E1', textDecoration: 'none', transition: 'color 0.15s' }}>Changelog</a></li>
          </ul>
        </div>

        {/* Company Column */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#F1F5F9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 18 }}>
            COMPANY
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
            <li><a href="#" style={{ color: '#CBD5E1', textDecoration: 'none' }}>About Us</a></li>
            <li><a href="#" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Services</a></li>
            <li><a href="#" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Privacy Policy</a></li>
            <li><a href="#" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Services & Support Policy</a></li>
            <li><a href="#" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Cookies Policy</a></li>
          </ul>
        </div>

        {/* Resources Column */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#F1F5F9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 18 }}>
            RESOURCES
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
            <li><a href="#" onClick={() => setIsTicketModalOpen(true)} style={{ color: '#CBD5E1', textDecoration: 'none', cursor: 'pointer' }}>Support ticket</a></li>
            <li><a href="#" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Documentation</a></li>
            <li><a href="#" style={{ color: '#CBD5E1', textDecoration: 'none' }}>FAQs</a></li>
            <li><a href="#" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Tutorials</a></li>
            <li><a href="#" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Blog</a></li>
            <li><a href="#" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Community</a></li>
            <li><a href="#" style={{ color: '#CBD5E1', textDecoration: 'none' }}>Demo</a></li>
          </ul>
        </div>

        {/* Contact Us Column */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#F1F5F9', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 18 }}>
            CONTACT US
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#CBD5E1', lineHeight: 1.6 }}>
            <div>+91 98765 43210</div>
            <div>support@foodie.com</div>
            <div style={{ fontSize: 13, marginTop: 2, color: '#64748B' }}>
              L: 02, H: 1005, 1007, Av: 11, R: 09, Foodie HQ, Bangalore 560103, IN
            </div>
          </div>
        </div>
      </div>



      {/* Support Ticket Modal */}
      {isTicketModalOpen ? (
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
          onClick={() => setIsTicketModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 480,
              width: '100%',
              padding: 28,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              color: '#1E293B',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', margin: 0 }}>
                 Submit Support Ticket
              </h3>
              <button
                type="button"
                onClick={() => setIsTicketModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#64748B' }}
              >
                
              </button>
            </div>

            {submitted ? (
              <div style={{ padding: '32px 0', textAlign: 'center' }}>
                <div style={{ fontSize: 48 }}></div>
                <h4 style={{ fontSize: 18, fontWeight: 800, color: '#14532D', marginTop: 12 }}>
                  Ticket #TK-8942 Submitted!
                </h4>
                <p style={{ fontSize: 13, color: '#64748B' }}>
                  Our technical support desk has logged your request. Response ETA: Under 15 minutes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitTicket} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Ticket Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vendor Commission Payout Discrepancy"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', marginTop: 4, outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#14532D' }}>Detailed Description</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Explain the operational issue or system query..."
                    value={ticketMsg}
                    onChange={(e) => setTicketMsg(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', marginTop: 4, outline: 'none', resize: 'vertical' }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    marginTop: 10,
                    padding: '12px',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  Submit Ticket Now 
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </footer>
  );
}
