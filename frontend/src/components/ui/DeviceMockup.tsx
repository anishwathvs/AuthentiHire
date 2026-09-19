import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  LayoutDashboard,
  Search,
  History,
  BookOpen,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  ExternalLink,
  Info,
  Lightbulb,
} from 'lucide-react';

interface DeviceMockupProps {
  type?: 'laptop' | 'browser' | 'card';
  children?: React.ReactNode;
  url?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const DeviceMockup: React.FC<DeviceMockupProps> = ({
  type = 'laptop',
  children,
  url = 'https://authentihire.app/app/dashboard',
  className = '',
  style = {},
}) => {
  const [tilt, setTilt] = useState({ x: -6, y: 3 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Subtle tilt range (-10 to 0 on Y, 0 to 6 on X)
    setTilt({
      x: -6 + (x / rect.width) * 4,
      y: 3 - (y / rect.height) * 4,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: -6, y: 3 });
  };

  if (type === 'browser') {
    return (
      <div
        className={`device-browser ${className}`}
        style={{
          borderRadius: '12px',
          backgroundColor: '#FFFFFF',
          border: '1px solid rgba(11, 31, 58, 0.12)',
          boxShadow: '0 20px 40px -15px rgba(11, 31, 58, 0.12), 0 0 1px rgba(11, 31, 58, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          ...style,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.625rem 1rem',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', gap: '0.375rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27C93F' }} />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', color: '#94A3B8' }}>
            <ArrowLeft size={13} />
            <ArrowRight size={13} />
            <RotateCw size={13} />
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.375rem',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '0.25rem 0.75rem',
              fontSize: '0.75rem',
              color: '#475569',
              fontFamily: 'monospace',
              maxWidth: '380px',
              margin: '0 auto',
            }}
          >
            <Lock size={11} color="#1677FF" />
            <span>{url}</span>
          </div>

          <div style={{ width: '48px' }} />
        </div>

        <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#F8FAFC' }}>
          {children || <AuthenticDashboardScreen />}
        </div>
      </div>
    );
  }

  // Realistic 3D Product Mockup: Angled Laptop with Studio Lighting & Authentic Dashboard Screen
  return (
    <div
      className={`device-laptop-container ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '920px',
        margin: '0 auto',
        perspective: '1400px',
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
    >
      {/* 3D Angled Frame */}
      <div
        style={{
          transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.15s ease-out',
        }}
      >
        {/* Laptop Display Chassis */}
        <div
          style={{
            position: 'relative',
            backgroundColor: '#090D16',
            borderRadius: '18px 18px 4px 4px',
            padding: '12px 12px 14px 12px',
            boxShadow:
              '0 30px 60px -15px rgba(11, 31, 58, 0.35), 0 0 0 1.5px rgba(255, 255, 255, 0.12) inset, 0 1px 3px rgba(0,0,0,0.5)',
            border: '1px solid #1E293B',
          }}
        >
          {/* Top Screen Bezel with Camera Notch & Ambient Sensor */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
              paddingBottom: '8px',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#1E293B',
                boxShadow: '0 0 2px rgba(0,0,0,0.8), 0 0 1px #38BDF8',
              }}
            />
          </div>

          {/* Screen Glass Surface with Subtle Reflection */}
          <div
            style={{
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.15)',
              position: 'relative',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
            }}
          >
            {/* Browser Header Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.45rem 0.75rem',
                backgroundColor: '#F1F5F9',
                borderBottom: '1px solid #E2E8F0',
                fontSize: '0.6875rem',
              }}
            >
              <div style={{ display: 'flex', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FF5F56' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#FFBD2E' }} />
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#27C93F' }} />
              </div>

              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '4px',
                  padding: '0.15rem 0.5rem',
                  fontSize: '0.6875rem',
                  color: '#475569',
                  maxWidth: '320px',
                  margin: '0 auto',
                  fontFamily: 'monospace',
                }}
              >
                <Lock size={10} color="#1677FF" />
                <span>{url}</span>
              </div>
            </div>

            {/* Screen Content Viewport: Authentic Dashboard Interface */}
            <div style={{ backgroundColor: '#F8FAFC', maxHeight: '520px', overflow: 'hidden' }}>
              {children || <AuthenticDashboardScreen />}
            </div>

            {/* Studio Light Specular Reflection Layer */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                background:
                  'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 30%, transparent 60%)',
              }}
            />
          </div>
        </div>

        {/* Laptop Aluminum Keyboard Base Deck */}
        <div
          style={{
            position: 'relative',
            height: '16px',
            backgroundColor: '#CBD5E1',
            backgroundImage: 'linear-gradient(180deg, #E2E8F0 0%, #CBD5E1 60%, #94A3B8 100%)',
            borderRadius: '0 0 24px 24px',
            borderTop: '2px solid #94A3B8',
            boxShadow:
              '0 18px 36px -6px rgba(11, 31, 58, 0.28), 0 2px 4px rgba(0,0,0,0.15), inset 0 1px 1px rgba(255,255,255,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}
        >
          {/* Center Opening Notch */}
          <div
            style={{
              width: '90px',
              height: '5px',
              backgroundColor: '#64748B',
              borderRadius: '0 0 5px 5px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)',
            }}
          />
        </div>
      </div>

      {/* Realistic Ground Contact Shadow */}
      <div
        style={{
          position: 'absolute',
          bottom: '-24px',
          left: '6%',
          right: '6%',
          height: '32px',
          background: 'radial-gradient(ellipse at center, rgba(11, 31, 58, 0.32) 0%, rgba(11, 31, 58, 0) 72%)',
          filter: 'blur(10px)',
          zIndex: -1,
        }}
      />
    </div>
  );
};

/**
 * Authentic AuthentiHire Dashboard Screen Component
 * Rendered inside the realistic laptop mockup with crisp typography, real metrics, and full information density.
 */
export const AuthenticDashboardScreen: React.FC = () => {
  return (
    <div style={{ display: 'flex', minHeight: '440px', fontSize: '11px', color: '#0F172A', fontFamily: 'inherit' }}>
      {/* Mini Sidebar */}
      <div
        style={{
          width: '145px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #EAECF0',
          padding: '0.75rem 0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.2rem',
          flexShrink: 0,
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0 0.375rem 0.5rem', borderBottom: '1px solid #F2F4F7', marginBottom: '0.25rem' }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={11} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '10px', color: '#0F172A', lineHeight: 1 }}>Authenti<span style={{ color: '#2563EB' }}>Hire</span></div>
            <div style={{ fontSize: '6px', color: '#94A3B8' }}>Safer Opportunities.</div>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.5rem', borderRadius: '5px', backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 600 }}>
          <LayoutDashboard size={11} />
          <span>Dashboard</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.5rem', borderRadius: '5px', color: '#475467' }}>
          <Search size={11} />
          <span>New Job Analysis</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.5rem', borderRadius: '5px', color: '#475467' }}>
          <History size={11} />
          <span>Analysis History</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.3rem 0.5rem', borderRadius: '5px', color: '#475467' }}>
          <BookOpen size={11} />
          <span>Saved Postings</span>
        </div>

        <div style={{ margin: '0.4rem 0.25rem', borderTop: '1px solid #EAECF0' }} />

        <div style={{ fontSize: '7.5px', fontWeight: 700, color: '#98A2B3', padding: '0.15rem 0.375rem', textTransform: 'uppercase' }}>Resources</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.5rem', borderRadius: '5px', color: '#475467' }}>
          <ShieldCheck size={10} />
          <span>Safety Guidelines</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.5rem', borderRadius: '5px', color: '#475467' }}>
          <AlertTriangle size={10} />
          <span>Red Flag Examples</span>
        </div>
      </div>

      {/* Main Workspace */}
      <div style={{ flex: 1, padding: '0.75rem 1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '13px', color: '#0F172A' }}>Welcome back, vsanishwath.cse2025!</div>
            <div style={{ fontSize: '8.5px', color: '#64748B' }}>Analyze job and internship postings for potential fraud.</div>
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            <div style={{ padding: '0.2rem 0.5rem', borderRadius: '5px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: '8px', width: '130px' }}>
              Paste a job posting to analyze...
            </div>
            <div style={{ padding: '0.25rem 0.6rem', borderRadius: '5px', backgroundColor: '#2563EB', color: '#FFFFFF', fontWeight: 600, fontSize: '8.5px', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <PlusCircle size={9} />
              <span>Analyze New Posting</span>
            </div>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #EAECF0', padding: '0.5rem' }}>
            <div style={{ fontSize: '7.5px', color: '#64748B', fontWeight: 600 }}>Total Postings Analyzed</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', marginTop: '1px' }}>28</div>
            <div style={{ fontSize: '6.5px', color: '#10B981', fontWeight: 600, marginTop: '2px' }}>↑ +12 this week</div>
          </div>
          <div style={{ backgroundColor: '#FEF2F2', borderRadius: '6px', border: '1px solid #FEE2E2', padding: '0.5rem' }}>
            <div style={{ fontSize: '7.5px', color: '#64748B', fontWeight: 600 }}>High / Critical Risks</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444', marginTop: '1px' }}>11</div>
            <div style={{ fontSize: '6.5px', color: '#EF4444', fontWeight: 600, marginTop: '2px' }}>↓ 39.3% of total</div>
          </div>
          <div style={{ backgroundColor: '#F0FDF4', borderRadius: '6px', border: '1px solid #DCFCE7', padding: '0.5rem' }}>
            <div style={{ fontSize: '7.5px', color: '#64748B', fontWeight: 600 }}>Verified Safe Postings</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#10B981', marginTop: '1px' }}>17</div>
            <div style={{ fontSize: '6.5px', color: '#10B981', fontWeight: 600, marginTop: '2px' }}>↓ 60.7% of total</div>
          </div>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #EAECF0', padding: '0.5rem' }}>
            <div style={{ fontSize: '7.5px', color: '#64748B', fontWeight: 600 }}>Average Risk Score</div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#2563EB', marginTop: '1px' }}>46.2</div>
            <div style={{ fontSize: '6.5px', color: '#64748B', marginTop: '2px' }}>Across all analyses</div>
          </div>
        </div>

        {/* Middle Two-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr', gap: '0.5rem', flex: 1 }}>
          {/* Left: Risk Distribution Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #EAECF0', padding: '0.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, fontSize: '9px', marginBottom: '0.25rem', color: '#0F172A' }}>Risk Distribution</div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {/* Donut Chart */}
              <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
                <svg width="60" height="60" viewBox="0 0 60 60">
                  <g transform="rotate(-90 30 30)">
                    <circle cx="30" cy="30" r="22" fill="transparent" stroke="#F1F5F9" strokeWidth="8" />
                    <circle cx="30" cy="30" r="22" fill="transparent" stroke="#10B981" strokeWidth="8" strokeDasharray="49 138" strokeDashoffset="0" />
                    <circle cx="30" cy="30" r="22" fill="transparent" stroke="#F59E0B" strokeWidth="8" strokeDasharray="34 138" strokeDashoffset="-49" />
                    <circle cx="30" cy="30" r="22" fill="transparent" stroke="#EF4444" strokeWidth="8" strokeDasharray="30 138" strokeDashoffset="-83" />
                    <circle cx="30" cy="30" r="22" fill="transparent" stroke="#991B1B" strokeWidth="8" strokeDasharray="25 138" strokeDashoffset="-113" />
                  </g>
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', fontWeight: 800 }}>28</span>
                  <span style={{ fontSize: '5px', color: '#64748B' }}>Total</span>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '7px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '2px', backgroundColor: '#10B981' }} />
                  <span>Low Risk (0–24)</span>
                  <strong style={{ marginLeft: 'auto' }}>10 (35.7%)</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '2px', backgroundColor: '#F59E0B' }} />
                  <span>Moderate Risk (25–49)</span>
                  <strong style={{ marginLeft: 'auto' }}>7 (25.0%)</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '2px', backgroundColor: '#EF4444' }} />
                  <span>High Risk (50–74)</span>
                  <strong style={{ marginLeft: 'auto' }}>6 (21.4%)</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '2px', backgroundColor: '#991B1B' }} />
                  <span>Critical Fraud (75–100)</span>
                  <strong style={{ marginLeft: 'auto' }}>5 (17.9%)</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right: How It Works Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #EAECF0', padding: '0.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 700, fontSize: '9px', color: '#0F172A' }}>How AuthentiHire Works</div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2px', fontSize: '6.5px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2px' }}>1</div>
                <span style={{ fontWeight: 700, color: '#2563EB' }}>Input</span>
              </div>
              <span style={{ color: '#CBD5E1' }}>→</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#F5F3FF', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2px' }}>2</div>
                <span style={{ fontWeight: 700 }}>AI Analysis</span>
              </div>
              <span style={{ color: '#CBD5E1' }}>→</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#F0FDF4', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2px' }}>3</div>
                <span style={{ fontWeight: 700 }}>Company</span>
              </div>
              <span style={{ color: '#CBD5E1' }}>→</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2px' }}>4</div>
                <span style={{ fontWeight: 700 }}>Risk Score</span>
              </div>
              <span style={{ color: '#CBD5E1' }}>→</span>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', backgroundColor: '#FEF2F2', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2px' }}>5</div>
                <span style={{ fontWeight: 700 }}>Report</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#FFFBEB', borderRadius: '4px', padding: '3px 6px', fontSize: '6.5px', color: '#92400E', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Lightbulb size={8} color="#D97706" />
              <span>Get instant insights about job authenticity using ML and real-world verification.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
