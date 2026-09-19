import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Building2, BarChart3, CheckCircle2 } from 'lucide-react';

const LOADING_STEPS = [
  { label: 'Analyzing your posting content...', icon: Search },
  { label: 'Checking heuristic scam signals & patterns...', icon: ShieldCheck },
  { label: 'Verifying available company & domain information...', icon: Building2 },
  { label: 'Synthesizing explainable risk assessment...', icon: BarChart3 },
];

export const LoadingState: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 1.5rem',
      minHeight: '400px',
    }}>
      <div className="card-base" style={{
        padding: '2.5rem 3rem',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Animated Pulse Ring */}
        <div style={{
          position: 'relative',
          width: '4rem',
          height: '4rem',
          margin: '0 auto 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-blue-light)',
            animation: 'pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }} />
          <div style={{
            position: 'relative',
            width: '2.75rem',
            height: '2.75rem',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-blue)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(22, 119, 255, 0.35)',
          }}>
            <ShieldCheck size={22} />
          </div>
        </div>

        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-navy-dark)',
          marginBottom: '0.5rem',
        }}>
          Analyzing Job Posting
        </h2>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
          marginBottom: '2rem',
        }}>
          Running multi-layer machine learning and rule-based verification...
        </p>

        {/* Step Progress Checklist */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.875rem',
          textAlign: 'left',
        }}>
          {LOADING_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.8125rem',
                  color: isCurrent
                    ? 'var(--color-primary-blue)'
                    : isCompleted
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                  fontWeight: isCurrent ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                  transition: 'color var(--transition-normal)',
                }}
              >
                <div style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCompleted
                    ? 'var(--color-risk-low-bg)'
                    : isCurrent
                    ? 'var(--color-primary-blue-light)'
                    : 'var(--color-bg-card-subtle)',
                  color: isCompleted
                    ? 'var(--color-risk-low)'
                    : isCurrent
                    ? 'var(--color-primary-blue)'
                    : 'var(--color-text-muted)',
                  flexShrink: 0,
                }}>
                  {isCompleted ? <CheckCircle2 size={12} /> : <span style={{ fontSize: '0.6875rem' }}>{idx + 1}</span>}
                </div>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.35); opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};
