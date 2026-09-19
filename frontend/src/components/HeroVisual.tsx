import React, { useState, useEffect, useRef } from 'react';
import { Search, ShieldAlert, Sparkles, FileText, CheckCircle2 } from 'lucide-react';

export const HeroVisual: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = () => setIsReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Restrained, subtle cursor tilt
    setRotate({
      x: -(y / rect.height) * 12,
      y: (x / rect.width) * 12,
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '520px',
        height: '420px',
        margin: '0 auto',
        perspective: '1200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="Layered job verification document visualization"
    >
      {/* Background Soft Blue Glow */}
      <div style={{
        position: 'absolute',
        width: '320px',
        height: '320px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(22, 119, 255, 0.15) 0%, rgba(22, 119, 255, 0.02) 65%, transparent 100%)',
        filter: 'blur(32px)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* 3D Transform Wrapper */}
      <div
        style={{
          position: 'relative',
          width: '340px',
          height: '360px',
          transformStyle: 'preserve-3d',
          transform: isReducedMotion
            ? 'none'
            : `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 2,
        }}
      >
        {/* Layer 1: Backing Translucent Blue Depth Layer */}
        <div style={{
          position: 'absolute',
          top: '-14px',
          left: '24px',
          right: '-24px',
          bottom: '14px',
          backgroundColor: 'rgba(22, 119, 255, 0.08)',
          border: '1px solid rgba(22, 119, 255, 0.2)',
          borderRadius: 'var(--radius-2xl)',
          backdropFilter: 'blur(10px)',
          transform: 'translateZ(-40px) rotateZ(3deg)',
          boxShadow: '0 20px 40px rgba(11, 31, 58, 0.06)',
        }} />

        {/* Layer 2: Middle Translucent Glass Layer */}
        <div style={{
          position: 'absolute',
          top: '-6px',
          left: '12px',
          right: '-12px',
          bottom: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.65)',
          border: '1px solid rgba(22, 119, 255, 0.18)',
          borderRadius: 'var(--radius-xl)',
          backdropFilter: 'blur(12px)',
          transform: 'translateZ(-20px) rotateZ(1.5deg)',
          boxShadow: '0 16px 32px rgba(11, 31, 58, 0.05)',
        }} />

        {/* Layer 3: Primary Job Posting Card */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid var(--color-border-hover)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem',
          boxShadow: '0 20px 40px -8px rgba(16, 24, 40, 0.1), 0 1px 3px rgba(16, 24, 40, 0.05)',
          transform: 'translateZ(10px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.125rem',
        }}>
          {/* Header of Document */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-primary-blue-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary-blue)',
              }}>
                <FileText size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                  Job Posting
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                  Full-time • Verified Source
                </div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              color: 'var(--color-risk-low)',
              fontSize: '0.75rem',
              fontWeight: 'var(--font-weight-medium)',
            }}>
              <CheckCircle2 size={14} />
              <span>Checked</span>
            </div>
          </div>

          {/* Document Content Skeleton Lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginTop: '0.25rem' }}>
            <div style={{ height: '8px', width: '85%', backgroundColor: '#E4E7EC', borderRadius: '4px' }} />
            <div style={{ height: '8px', width: '95%', backgroundColor: '#F2F4F7', borderRadius: '4px' }} />
            <div style={{ height: '8px', width: '70%', backgroundColor: '#F2F4F7', borderRadius: '4px' }} />
            <div style={{ height: '8px', width: '88%', backgroundColor: '#F2F4F7', borderRadius: '4px' }} />
          </div>

          {/* Inner Verification Checkbox Box */}
          <div style={{
            marginTop: 'auto',
            padding: '0.875rem',
            backgroundColor: 'var(--color-bg-card-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-dark)' }}>
                Multi-Layered Verification
              </span>
              <span style={{ fontSize: '0.6875rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-blue)' }}>
                100% EXPLAINABLE
              </span>
            </div>
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <span className="badge badge-blue" style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem' }}>ML Calibrated</span>
              <span className="badge badge-neutral" style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem' }}>13 Scam Rules</span>
              <span className="badge badge-neutral" style={{ fontSize: '0.6875rem', padding: '0.2rem 0.5rem' }}>Domain Audit</span>
            </div>
          </div>
        </div>

        {/* Floating Badge 1: Top Right - Analyze */}
        <div style={{
          position: 'absolute',
          top: '-18px',
          right: '-36px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border-hover)',
          borderRadius: 'var(--radius-full)',
          padding: '0.5rem 0.875rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8125rem',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-navy-dark)',
          transform: 'translateZ(35px)',
        }}>
          <div style={{
            width: '1.25rem',
            height: '1.25rem',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-blue-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary-blue)',
          }}>
            <Search size={12} strokeWidth={2.5} />
          </div>
          <span>Analyze</span>
        </div>

        {/* Floating Badge 2: Middle Right - Identify Risks */}
        <div style={{
          position: 'absolute',
          top: '120px',
          right: '-54px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border-hover)',
          borderRadius: 'var(--radius-full)',
          padding: '0.5rem 0.875rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8125rem',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-navy-dark)',
          transform: 'translateZ(45px)',
        }}>
          <div style={{
            width: '1.25rem',
            height: '1.25rem',
            borderRadius: '50%',
            backgroundColor: 'var(--color-risk-high-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-risk-high)',
          }}>
            <ShieldAlert size={12} strokeWidth={2.5} />
          </div>
          <span>Identify Risks</span>
        </div>

        {/* Floating Badge 3: Bottom Right - Build Confidence */}
        <div style={{
          position: 'absolute',
          bottom: '-16px',
          right: '-28px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--color-border-hover)',
          borderRadius: 'var(--radius-full)',
          padding: '0.5rem 0.875rem',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8125rem',
          fontWeight: 'var(--font-weight-semibold)',
          color: 'var(--color-navy-dark)',
          transform: 'translateZ(40px)',
        }}>
          <div style={{
            width: '1.25rem',
            height: '1.25rem',
            borderRadius: '50%',
            backgroundColor: 'var(--color-risk-low-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-risk-low)',
          }}>
            <Sparkles size={12} strokeWidth={2.5} />
          </div>
          <span>Build Confidence</span>
        </div>
      </div>
    </div>
  );
};
