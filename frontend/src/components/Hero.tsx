import React from 'react';
import { ArrowRight, Search, Building2, BarChart3, ShieldCheck } from 'lucide-react';
import { HeroVisual } from './HeroVisual';

interface HeroProps {
  onStartAnalysis: () => void;
  onOpenHowItWorks: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onStartAnalysis,
  onOpenHowItWorks,
}) => {
  return (
    <section style={{
      paddingTop: '3.5rem',
      paddingBottom: '5rem',
      position: 'relative',
    }}>
      <div className="container">
        {/* Top Hero Grid: 2 Columns on Desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '3.5rem',
          alignItems: 'center',
        }} className="hero-main-grid">

          {/* Left Hero Column */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            {/* Top Pill Tag */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.875rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-primary-blue-light)',
              border: '1px solid var(--color-primary-blue-border)',
              color: 'var(--color-primary-blue)',
              fontSize: '0.8125rem',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: '1.5rem',
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-blue)',
              }} />
              <span>Safer Jobs. Brighter Futures.</span>
            </div>

            {/* Primary Headline */}
            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
              fontWeight: 800,
              lineHeight: 1.08,
              letterSpacing: '-0.035em',
              color: 'var(--color-text-primary)',
              marginBottom: '1.25rem',
            }}>
              Find work with <span style={{ color: 'var(--color-primary-blue)' }}>confidence.</span>
            </h1>

            {/* Supporting Subheading */}
            <p style={{
              fontSize: 'clamp(1rem, 2vw, 1.1875rem)',
              lineHeight: 1.6,
              color: 'var(--color-text-secondary)',
              maxWidth: '540px',
              marginBottom: '2.25rem',
            }}>
              Check a job or internship posting for fraud signals, company evidence, and risk before you decide what to do next.
            </p>

            {/* CTA Buttons */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              marginBottom: '3.5rem',
            }}>
              <button
                onClick={onStartAnalysis}
                className="btn-primary"
                style={{
                  fontSize: '1rem',
                  padding: '0.875rem 1.75rem',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <span>Analyze a job</span>
                <ArrowRight size={18} />
              </button>
              <button
                onClick={onOpenHowItWorks}
                className="btn-secondary"
                style={{
                  fontSize: '1rem',
                  padding: '0.875rem 1.625rem',
                }}
              >
                <span>How it works</span>
              </button>
            </div>

            {/* 3 Concise Feature Badges */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '1.5rem',
              width: '100%',
              borderTop: '1px solid var(--color-border-default)',
              paddingTop: '2rem',
            }}>
              {/* Feature 1: Detect */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-blue-light)',
                  color: 'var(--color-primary-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Search size={16} strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                    Detect
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.125rem' }}>
                    Scam signals & risky patterns
                  </div>
                </div>
              </div>

              {/* Feature 2: Verify */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-blue-light)',
                  color: 'var(--color-primary-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Building2 size={16} strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                    Verify
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.125rem' }}>
                    Company & website info
                  </div>
                </div>
              </div>

              {/* Feature 3: Understand */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-primary-blue-light)',
                  color: 'var(--color-primary-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <BarChart3 size={16} strokeWidth={2.2} />
                </div>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                    Understand
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '0.125rem' }}>
                    Clear, explainable results
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Hero Column: 3D Visual + Right Context Copy */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            alignItems: 'center',
          }}>
            <HeroVisual />

            {/* Editorial Context Block */}
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border-default)',
              borderRadius: 'var(--radius-xl)',
              padding: '1.5rem 1.75rem',
              boxShadow: 'var(--shadow-card)',
              maxWidth: '480px',
              width: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ShieldCheck size={18} color="var(--color-primary-blue)" />
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-navy-dark)' }}>
                  A safer tomorrow starts with smarter choices.
                </h3>
              </div>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
                AuthentiHire combines machine learning, scam-detection rules, and company intelligence to help you navigate the job market with greater confidence.
              </p>
              <div style={{ fontSize: '0.8125rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-tertiary)' }}>
                Opportunities are everywhere. So is caution.
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 992px) {
          .hero-main-grid {
            grid-template-columns: 1.15fr 0.85fr !important;
          }
        }
      `}</style>
    </section>
  );
};
