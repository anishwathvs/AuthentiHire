import React from 'react';
import { X, ShieldCheck, Cpu, Building2, Search, CheckCircle2 } from 'lucide-react';

interface InfoModalProps {
  type: 'how-it-works' | 'about' | 'resources' | null;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(11, 31, 58, 0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem',
    }}>
      <div className="card-base" style={{
        maxWidth: '620px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2rem',
        position: 'relative',
        boxShadow: 'var(--shadow-xl)',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: '2rem',
            height: '2rem',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-tertiary)',
            backgroundColor: 'var(--color-bg-card-subtle)',
          }}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {type === 'how-it-works' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-blue-light)', color: 'var(--color-primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu size={20} />
              </div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-navy-dark)' }}>
                How AuthentiHire Works
              </h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              AuthentiHire utilizes a multi-layered, explainable fraud-risk detection engine designed to protect job seekers from predatory schemes:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-card-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: '0.9375rem', color: 'var(--color-navy-dark)', marginBottom: '0.25rem' }}>
                  1. Calibrated Machine Learning (50% Base Weight)
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  An isotonic-calibrated Logistic Regression classifier trained on verified legitimate and fraudulent job datasets. Produces statistically reliable fraud probabilities.
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-card-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: '0.9375rem', color: 'var(--color-navy-dark)', marginBottom: '0.25rem' }}>
                  2. Explainable Rule Engine (30% Base Weight)
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  13 deterministic heuristics detecting upfront application fees, fake cashier check equipment schemes, suspicious Telegram/WhatsApp interviews, and urgency tactics.
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-card-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: '0.9375rem', color: 'var(--color-navy-dark)', marginBottom: '0.25rem' }}>
                  3. Company & Domain Intelligence (20% Base Weight)
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                  Verifies recruiter email domains against company web presence, flags free consumer email providers, checks SSL certificates, and identifies suspicious URL shorteners.
                </div>
              </div>
            </div>
          </div>
        )}

        {type === 'about' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-blue-light)', color: 'var(--color-primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={20} />
              </div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-navy-dark)' }}>
                About AuthentiHire
              </h2>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
              AuthentiHire was engineered to combat the rising wave of online employment scams, fake internship postings, and identity-theft schemes targeting students, graduates, and remote workers.
            </p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Unlike black-box AI tools, AuthentiHire provides 100% explainable, multi-factor assessments with concrete evidence quotes and actionable candidate recommendations.
            </p>
            <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Engineered with Python, Scikit-Learn, FastAPI, React, and TypeScript.
            </div>
          </div>
        )}

        {type === 'resources' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-blue-light)', color: 'var(--color-primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} />
              </div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-navy-dark)' }}>
                Candidate Safety Resources
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.8125rem' }}>
              <div style={{ padding: '0.875rem', backgroundColor: 'var(--color-bg-card-subtle)', borderRadius: 'var(--radius-md)' }}>
                <strong style={{ color: 'var(--color-navy-dark)', display: 'block', marginBottom: '0.25rem' }}>
                  🚫 Never Pay Upfront Fees
                </strong>
                Legitimate employers will never ask you to pay for background checks, training materials, onboarding kits, or application processing.
              </div>

              <div style={{ padding: '0.875rem', backgroundColor: 'var(--color-bg-card-subtle)', borderRadius: 'var(--radius-md)' }}>
                <strong style={{ color: 'var(--color-navy-dark)', display: 'block', marginBottom: '0.25rem' }}>
                  🚫 Beware of Fake Cashier Checks
                </strong>
                Scammers frequently send fake checks and instruct candidates to purchase home office equipment from &ldquo;approved vendors&rdquo;. The check bounces days later.
              </div>

              <div style={{ padding: '0.875rem', backgroundColor: 'var(--color-bg-card-subtle)', borderRadius: 'var(--radius-md)' }}>
                <strong style={{ color: 'var(--color-navy-dark)', display: 'block', marginBottom: '0.25rem' }}>
                  🔒 Verify Official Domains
                </strong>
                Verify that recruiters contact you from official corporate domains rather than free Gmail, Yahoo, or Outlook addresses.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
