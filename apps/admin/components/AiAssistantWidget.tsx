'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  metrics?: { label: string; value: string }[];
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'm-1',
    sender: 'ai',
    text: 'Hello Admin! How can I help you today? Ask me about live order dispatch, restaurant performance, delivery fleet bottlenecks, or revenue telemetry.',
    timestamp: 'Just now',
    metrics: [
      { label: 'Live Orders', value: '324' },
      { label: 'Gross Volume', value: '₹14,850' },
      { label: 'Fleet Online', value: '28 / 32' },
    ],
  },
];

const QUICK_PROMPTS = [
  ' Analyze today\'s revenue & order trends',
  ' Which restaurant needs operational boost?',
  ' Check live delivery fleet bottlenecks',
  ' Suggest best promo coupon strategy',
];

export function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const generateAiReply = (query: string) => {
    const q = query.toLowerCase();
    let text = '';
    let metrics: { label: string; value: string }[] | undefined;

    if (q.includes('revenue') || q.includes('sales') || q.includes('trend')) {
      text = 'Today\'s Gross Marketplace Volume reached ₹14,850 across 324 completed orders (+18.4% vs yesterday). North Indian Biryani and Italian Pizzerias generated 62% of peak lunch revenue.';
      metrics = [
        { label: 'Avg Order Value', value: '₹458.30' },
        { label: 'Peak Hour', value: '1:30 PM - 2:30 PM' },
      ];
    } else if (q.includes('restaurant') || q.includes('vendor') || q.includes('boost')) {
      text = 'Royal Biryani House is performing top with 1,420 monthly orders. Sweet Dreams Bakery has 1 pending KYC review. I recommend approving their menu to capture evening dessert traffic!';
      metrics = [
        { label: 'Top Vendor', value: 'Royal Biryani House' },
        { label: 'Pending Approval', value: '1 Store' },
      ];
    } else if (q.includes('delivery') || q.includes('fleet') || q.includes('bottleneck')) {
      text = '28 out of 32 registered delivery partners are currently ONLINE in Downtown Central. Average delivery fulfillment time is 22 minutes (well within the 30-min SLA). No active bottlenecks detected.';
      metrics = [
        { label: 'Fulfillment Time', value: '22 mins' },
        { label: 'Fleet Utilization', value: '87.5%' },
      ];
    } else if (q.includes('coupon') || q.includes('promo') || q.includes('discount')) {
      text = 'Code FOODIE50 (50% OFF) has achieved 1,240 redemptions with a 4.2x ROI. Suggesting a weekend campaign "PIZZA100" offering ₹100 flat discount on Italian restaurants with min order ₹500.';
      metrics = [
        { label: 'Active Promos', value: '3 Codes' },
        { label: 'Est. Revenue Lift', value: '+24%' },
      ];
    } else {
      text = `I have analyzed your query: "${query}". All system dispatch pipelines, payment webhooks, and multi-vendor operations are running synchronously with 99.9% uptime.`;
    }

    const newAiMessage: ChatMessage = {
      id: `ai-${Date.now()}`,
      sender: 'ai',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      metrics,
    };

    setMessages((prev) => [...prev, newAiMessage]);
    setIsTyping(false);
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? inputValue).trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      generateAiReply(text);
    }, 900);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 9999,
          backgroundColor: '#14532D',
          color: '#F59E0B',
          border: '2px solid #F59E0B',
          borderRadius: 30,
          padding: '12px 20px',
          fontWeight: 800,
          fontSize: 14,
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(20, 83, 45, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <span style={{ fontSize: 18 }}></span>
        <span>FoodieBot</span>
      </button>

      {/* Floating AI Chat Window Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: 90,
            right: 28,
            width: 400,
            height: 540,
            backgroundColor: '#FFFFFF',
            borderRadius: 16,
            boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            border: '1px solid #E2E8F0',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              backgroundColor: '#0F3D21',
              color: '#FFFFFF',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}></span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF' }}>
                  FoodieBot
                </div>
                <div style={{ fontSize: 11, color: '#FEF3C7', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#10B981',
                      display: 'inline-block',
                    }}
                  />
                  How can I help you today?
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#E6F4EA',
                fontSize: 18,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
            }}
          >
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '5px 10px',
                  borderRadius: 20,
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#14532D',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Messages Stream */}
          <div
            style={{
              flex: 1,
              padding: 16,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              backgroundColor: '#F1F5F9',
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  backgroundColor: m.sender === 'user' ? '#14532D' : '#FFFFFF',
                  color: m.sender === 'user' ? '#FFFFFF' : '#1E293B',
                  padding: '12px 14px',
                  borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  border: m.sender === 'user' ? 'none' : '1px solid #E2E8F0',
                }}
              >
                <div style={{ fontSize: 13, lineHeight: 1.45 }}>{m.text}</div>

                {/* Optional Metrics Cards embedded in AI responses */}
                {m.metrics && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                      gap: 8,
                      marginTop: 10,
                      paddingTop: 8,
                      borderTop: '1px dashed #E2E8F0',
                    }}
                  >
                    {m.metrics.map((met) => (
                      <div
                        key={met.label}
                        style={{
                          backgroundColor: '#F8FAFC',
                          padding: '6px 8px',
                          borderRadius: 6,
                          border: '1px solid #CBD5E1',
                        }}
                      >
                        <div style={{ fontSize: 10, color: '#64748B' }}>{met.label}</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#14532D' }}>
                          {met.value}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    fontSize: 10,
                    color: m.sender === 'user' ? '#A7F3D0' : '#94A3B8',
                    marginTop: 6,
                    textAlign: 'right',
                  }}
                >
                  {m.timestamp}
                </div>
              </div>
            ))}

            {isTyping && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#FFFFFF',
                  padding: '10px 14px',
                  borderRadius: '14px 14px 14px 2px',
                  fontSize: 12,
                  color: '#64748B',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span> FoodieBot is thinking</span>
                <span className="pulse-live" style={{ width: 6, height: 6, backgroundColor: '#F59E0B', borderRadius: '50%' }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div
            style={{
              padding: 12,
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              gap: 8,
            }}
          >
            <input
              type="text"
              placeholder="Message FoodieBot..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              style={{
                padding: '10px 16px',
                backgroundColor: '#14532D',
                color: '#F59E0B',
                border: 'none',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
