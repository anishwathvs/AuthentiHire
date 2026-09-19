import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  Filter,
  Binary,
  Cpu,
  FileWarning,
  Globe,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ArrowDown,
  Info,
} from 'lucide-react';
import { AnimatedSection } from '../../components/ui/AnimatedSection';

interface PipelineStep {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  description: string;
  details: string[];
}

export const HowItWorksPage: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState<string>('ml');

  const steps: PipelineStep[] = [
    {
      id: 'input',
      number: '01',
      name: 'Job Posting Input',
      subtitle: 'Raw posting ingestion',
      icon: <FileText size={20} color="#1677FF" />,
      description: 'The user submits the job title, company name, website URL, recruiter email, and complete job description.',
      details: [
        'Supports pasted plain text and formatted job specs',
        'Optional fields (recruiter email, company URL) enable deep external cross-checks',
        'Character limit bounds prevent Denial-of-Service and memory spikes',
      ],
    },
    {
      id: 'preprocess',
      number: '02',
      name: 'Text Preprocessing & Sanitization',
      subtitle: 'Canonical text transformation',
      icon: <Filter size={20} color="#1677FF" />,
      description: 'Standardizes text, strips dangerous XSS/HTML vectors, extracts candidate email addresses, URLs, and metadata tokens.',
      details: [
        'Unicode normalization and whitespace cleanup',
        'Entity extraction for company domains and recruiter contact addresses',
        'Preserves casing markers and monetary symbols critical for scam heuristics',
      ],
    },
    {
      id: 'tfidf',
      number: '03',
      name: 'TF-IDF Feature Vectorization',
      subtitle: 'Sparse n-gram tokenization',
      icon: <Binary size={20} color="#1677FF" />,
      description: 'Transforms preprocessed text into high-dimensional numerical feature vectors using a frozen vocabulary.',
      details: [
        'Unigrams and bigrams capture deceitful linguistic combinations',
        'Sublinear term frequency scaling dampens repetitive keyword stuffing',
        'Strict vocabulary parity ensures deterministic inference matching training artifacts',
      ],
    },
    {
      id: 'ml',
      number: '04',
      name: 'Calibrated Machine Learning',
      subtitle: 'Logistic Regression with Platt Scaling',
      icon: <Cpu size={20} color="#1677FF" />,
      description: 'Evaluates the TF-IDF representation against trained weights to compute a well-calibrated posterior fraud probability.',
      details: [
        'Probability is strictly calibrated between 0.0000 and 1.0000',
        'Operating threshold at 0.50 prioritizes precision to minimize false positives on legitimate employers',
        'Outputs top positive and negative predictive feature contributions for explainability',
      ],
    },
    {
      id: 'rules',
      number: '05',
      name: 'Heuristic Scam Engine',
      subtitle: 'Deterministic pattern matching',
      icon: <FileWarning size={20} color="#F04438" />,
      description: 'Scans the posting against codified threat rules representing known real-world employment scam playbooks.',
      details: [
        'Detects fake cashier check equipment purchases and advance fees',
        'Identifies unofficial messaging interviews (Telegram, WhatsApp, Signal)',
        'Flags cryptocurrency and wire transfer compensation requests',
        'Extracts verbatim snippet evidence for complete auditability',
      ],
    },
    {
      id: 'intel',
      number: '06',
      name: 'Company & Website Intelligence',
      subtitle: 'Live infrastructure verification',
      icon: <Globe size={20} color="#12B76A" />,
      description: 'Queries verifiable public network infrastructure with strict SSRF guards and bounded timeouts.',
      details: [
        'Live DNS host resolution and MX mail server validation',
        'SSL/TLS certificate chain validation and domain age checks',
        'Cross-checks recruiter email domain against company website domain',
        'Neutrally marks unreachable domains as UNAVAILABLE without fabricating data',
      ],
    },
    {
      id: 'unification',
      number: '07',
      name: 'Unified Risk Assessment & Decision',
      subtitle: 'Multi-signal mathematical synthesis',
      icon: <Sliders size={20} color="#1677FF" />,
      description: 'Combines ML fraud probability, rule suspicion scores, and company trust score into an immutable 0–100 risk verdict.',
      details: [
        'Applies deterministic risk band boundaries (0–24 Low, 25–49 Moderate, 50–74 High, 75–100 Critical)',
        'Generates actionable recommendations and corroborating multi-signal explanations',
        'Persists an immutable snapshot linked to the user account or anonymous session',
      ],
    },
  ];

  return (
    <div style={{ backgroundColor: '#FFFFFF', paddingBottom: '6rem' }}>
      {/* Header */}
      <section style={{ padding: '5rem 1.5rem 4rem', backgroundColor: '#F8FAFC', borderBottom: '1px solid #EAECF0' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: '#F0F7FF',
              color: '#1677FF',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            Technical Deep Dive
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
              fontWeight: 800,
              color: '#0B1F3A',
              letterSpacing: '-0.035em',
              marginBottom: '1.25rem',
            }}
          >
            How the Detection Engine Works
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#475467', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto' }}>
            From raw posting text to a multi-signal risk verdict: explore the complete mathematical and architectural pipeline powering AuthentiHire.
          </p>
        </div>
      </section>

      {/* Metrics Disambiguation Section */}
      <section style={{ padding: '4rem 1.5rem', backgroundColor: '#FFFFFF', borderBottom: '1px solid #EAECF0' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em' }}>
              Understanding the Three Core Measurements
            </h2>
            <p style={{ color: '#667085', fontSize: '1rem', marginTop: '0.5rem' }}>
              AuthentiHire produces three distinct metrics. It is critical to understand how they differ.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
            {/* Metric 1 */}
            <div style={{ padding: '2rem', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #EAECF0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#1677FF', fontWeight: 700, fontSize: '0.875rem' }}>
                <Cpu size={18} />
                <span>STATISTICAL SIGNAL</span>
              </div>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0B1F3A', marginBottom: '0.75rem' }}>
                Fraud Probability
              </h3>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#1677FF', marginBottom: '0.75rem' }}>
                Range: 0.00 to 1.00 (or 0% to 100%)
              </div>
              <p style={{ fontSize: '0.9375rem', color: '#475467', lineHeight: 1.6 }}>
                The probability generated by the calibrated Machine Learning classifier that the vocabulary and stylistic phrasing match fraudulent job patterns.
              </p>
            </div>

            {/* Metric 2 */}
            <div style={{ padding: '2rem', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #EAECF0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#12B76A', fontWeight: 700, fontSize: '0.875rem' }}>
                <Globe size={18} />
                <span>INFRASTRUCTURE SIGNAL</span>
              </div>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0B1F3A', marginBottom: '0.75rem' }}>
                Company Trust Score
              </h3>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#12B76A', marginBottom: '0.75rem' }}>
                Range: 1 to 100
              </div>
              <p style={{ fontSize: '0.9375rem', color: '#475467', lineHeight: 1.6 }}>
                Measures the public verifiability of the employer: DNS resolution, active mail servers (MX), valid SSL certificates, and domain-email consistency.
              </p>
            </div>

            {/* Metric 3 */}
            <div style={{ padding: '2rem', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #EAECF0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#F04438', fontWeight: 700, fontSize: '0.875rem' }}>
                <Sliders size={18} />
                <span>UNIFIED SYNTHESIS</span>
              </div>
              <h3 style={{ fontSize: '1.375rem', fontWeight: 800, color: '#0B1F3A', marginBottom: '0.75rem' }}>
                Overall Risk Score
              </h3>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F04438', marginBottom: '0.75rem' }}>
                Range: 0 to 100
              </div>
              <p style={{ fontSize: '0.9375rem', color: '#475467', lineHeight: 1.6 }}>
                The composite risk score weighting ML probabilities (45%), heuristic scam rules (35%), and company intelligence trust (20%) into a final actionable verdict.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Pipeline Architecture Diagram */}
      <section style={{ padding: '5rem 1.5rem', backgroundColor: '#F8FAFC', borderBottom: '1px solid #EAECF0' }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.025em' }}>
              Interactive End-to-End Pipeline Architecture
            </h2>
            <p style={{ color: '#667085', fontSize: '1rem', marginTop: '0.5rem' }}>
              Select any stage below to inspect its data structures, models, and outputs.
            </p>
          </div>

          {/* Stepper Tabs */}
          <div
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '0.75rem',
              paddingBottom: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            {steps.map((step) => {
              const isSelected = selectedStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setSelectedStep(step.id)}
                  style={{
                    flex: '1 0 140px',
                    padding: '1rem',
                    borderRadius: '12px',
                    backgroundColor: isSelected ? '#FFFFFF' : '#F1F5F9',
                    border: isSelected ? '2px solid #1677FF' : '1px solid #E2E8F0',
                    boxShadow: isSelected ? '0 4px 12px rgba(22, 119, 255, 0.15)' : 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: isSelected ? '#1677FF' : '#94A3B8' }}>
                    {step.number}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0B1F3A', marginTop: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {step.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Stage Detail Panel */}
          {(() => {
            const active = steps.find((s) => s.id === selectedStep) || steps[0];
            return (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  padding: '2.5rem',
                  border: '1px solid #EAECF0',
                  boxShadow: '0 4px 20px -2px rgba(11, 31, 58, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EFF8FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {active.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1677FF', textTransform: 'uppercase' }}>
                      Stage {active.number} • {active.subtitle}
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0B1F3A', margin: 0 }}>
                      {active.name}
                    </h3>
                  </div>
                </div>

                <p style={{ fontSize: '1.0625rem', color: '#475467', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  {active.description}
                </p>

                <div style={{ borderTop: '1px solid #F2F4F7', paddingTop: '1.25rem' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0B1F3A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                    Key Technical Specifications & Guarantees:
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {active.details.map((detail, idx) => (
                      <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.9375rem', color: '#475467' }}>
                        <CheckCircle2 size={16} color="#1677FF" style={{ marginTop: '3px', flexShrink: 0 }} />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ textAlign: 'center', paddingTop: '4rem' }}>
        <Link
          to="/app/analyze"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.875rem 1.75rem',
            borderRadius: '10px',
            backgroundColor: '#1677FF',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '1rem',
            textDecoration: 'none',
            boxShadow: '0 4px 14px rgba(22, 119, 255, 0.3)',
          }}
        >
          <span>Try an analysis in the workspace</span>
          <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
};
