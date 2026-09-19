import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface FooterProps {
  onOpenModal: (modal: 'how-it-works' | 'about' | 'resources') => void;
  onNavigate: (view: 'home' | 'analyze') => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenModal, onNavigate }) => {
  return (
    <footer style={{
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid var(--color-border-default)',
      paddingTop: '3rem',
      paddingBottom: '2.5rem',
      marginTop: 'auto',
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '2rem',
          paddingBottom: '2rem',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}>
          {/* Brand Info */}
          <div style={{ maxWidth: '360px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-primary-blue-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary-blue)',
              }}>
                <ShieldCheck size={16} />
              </div>
              <span style={{ fontSize: '1.125rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-navy-dark)' }}>
                AuthentiHire
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
              Commercial-grade job and internship scam detection system synthesizing calibrated machine learning, heuristic rules, and domain intelligence.
            </p>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-navy-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Application
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <button onClick={() => onNavigate('home')} style={{ textAlign: 'left', color: 'var(--color-text-secondary)' }}>Home</button>
                <button onClick={() => onNavigate('analyze')} style={{ textAlign: 'left', color: 'var(--color-text-secondary)' }}>Analyze Posting</button>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-navy-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                Architecture
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8125rem' }}>
                <button onClick={() => onOpenModal('how-it-works')} style={{ textAlign: 'left', color: 'var(--color-text-secondary)' }}>How It Works</button>
                <button onClick={() => onOpenModal('about')} style={{ textAlign: 'left', color: 'var(--color-text-secondary)' }}>About</button>
                <button onClick={() => onOpenModal('resources')} style={{ textAlign: 'left', color: 'var(--color-text-secondary)' }}>Resources</button>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright & Disclaimer */}
        <div style={{
          paddingTop: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.75rem',
          color: 'var(--color-text-muted)',
        }}>
          <div>AuthentiHire © 2026. All rights reserved.</div>
          <div>Multi-layer calibrated ML &amp; heuristic rule architecture.</div>
        </div>
      </div>
    </footer>
  );
};
