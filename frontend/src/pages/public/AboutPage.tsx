import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, FileWarning, Globe, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AnimatedSection } from '../../components/ui/AnimatedSection';

export const AboutPage: React.FC = () => {
  return (
    <div style={{ backgroundColor: '#FFFFFF', paddingBottom: '6rem' }}>
      {/* Editorial Header */}
      <section style={{ padding: '5rem 1.5rem 4rem', backgroundColor: '#F8FAFC', borderBottom: '1px solid #EAECF0' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
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
            Mission & Methodology
          </div>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 4vw, 3.5rem)',
              fontWeight: 800,
              color: '#0B1F3A',
              letterSpacing: '-0.035em',
              lineHeight: 1.15,
              marginBottom: '1.25rem',
            }}
          >
            Protecting job seekers through transparent, evidence-based intelligence.
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#475467', lineHeight: 1.6 }}>
            AuthentiHire was built to bridge the gap between deceptive recruitment campaigns and vulnerable job seekers by replacing black-box algorithms with explainable, verifiable risk indicators.
          </p>
        </div>
      </section>

      {/* Main Editorial Content */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '4rem 1.5rem 0' }}>
        {/* Section 1: The Problem */}
        <AnimatedSection style={{ marginBottom: '4.5rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.025em', marginBottom: '1rem' }}>
            Why recruitment fraud is notoriously deceptive
          </h2>
          <p style={{ fontSize: '1.0625rem', color: '#475467', lineHeight: 1.7, marginBottom: '1rem' }}>
            Modern employment scams rarely look like amateur spam. Sophisticated fraudsters impersonate legitimate enterprises, clone real corporate logos, and post believable job requisitions across major career portals.
          </p>
          <p style={{ fontSize: '1.0625rem', color: '#475467', lineHeight: 1.7 }}>
            When job seekers apply, bad actors leverage social engineering—such as fake equipment purchase checks, bogus background check fees, or unencrypted messaging app interviews—to extract banking credentials and personal identity data.
          </p>
        </AnimatedSection>

        {/* Section 2: Our Layered Architecture */}
        <AnimatedSection style={{ marginBottom: '4.5rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.025em', marginBottom: '1.25rem' }}>
            Our Multi-Layered Inspection Engine
          </h2>
          <p style={{ fontSize: '1.0625rem', color: '#475467', lineHeight: 1.7, marginBottom: '2rem' }}>
            AuthentiHire does not rely on a single ML model. Instead, three independent analytical pipelines evaluate each opportunity:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid #EAECF0', backgroundColor: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Cpu size={20} color="#1677FF" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
                  1. Calibrated Machine Learning
                </h3>
              </div>
              <p style={{ fontSize: '0.9375rem', color: '#475467', lineHeight: 1.6, margin: 0 }}>
                Calibrated Logistic Regression model with Platt scaling trained on thousands of labeled postings to output an objective probability of deceptive text patterns.
              </p>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid #EAECF0', backgroundColor: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <FileWarning size={20} color="#F04438" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
                  2. Heuristic Scam Pattern Rules
                </h3>
              </div>
              <p style={{ fontSize: '0.9375rem', color: '#475467', lineHeight: 1.6, margin: 0 }}>
                Deterministic rules covering known scam playbooks: cashier checks, crypto payments, WhatsApp/Telegram-only interviews, and upfront software fee demands.
              </p>
            </div>

            <div style={{ padding: '1.5rem', borderRadius: '12px', border: '1px solid #EAECF0', backgroundColor: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <Globe size={20} color="#12B76A" />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
                  3. Company & Website Intelligence
                </h3>
              </div>
              <p style={{ fontSize: '0.9375rem', color: '#475467', lineHeight: 1.6, margin: 0 }}>
                Live validation of employer domain infrastructure: DNS resolution, MX mail server validity, SSL certificates, domain age consistency, and recruiter email matching.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* Section 3: Understanding Risk Scores */}
        <AnimatedSection style={{ marginBottom: '4.5rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.025em', marginBottom: '1rem' }}>
            How to interpret the 0–100 Unified Risk Score
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            <div style={{ padding: '1.25rem', borderRadius: '10px', backgroundColor: '#ECFDF3', border: '1px solid #A6F4C5' }}>
              <div style={{ fontWeight: 800, color: '#027A48', fontSize: '1.125rem' }}>0 – 24</div>
              <div style={{ fontWeight: 700, color: '#027A48', fontSize: '0.875rem', marginTop: '0.25rem' }}>LOW RISK</div>
              <p style={{ fontSize: '0.8125rem', color: '#027A48', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Consistent corporate signals and standard hiring practices observed.
              </p>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: '10px', backgroundColor: '#FFFAEB', border: '1px solid #FEDF89' }}>
              <div style={{ fontWeight: 800, color: '#B54708', fontSize: '1.125rem' }}>25 – 49</div>
              <div style={{ fontWeight: 700, color: '#B54708', fontSize: '0.875rem', marginTop: '0.25rem' }}>MODERATE RISK</div>
              <p style={{ fontSize: '0.8125rem', color: '#B54708', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Minor inconsistencies or unverified domains. Independent verification recommended.
              </p>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: '10px', backgroundColor: '#FEF3F2', border: '1px solid #FECDCA' }}>
              <div style={{ fontWeight: 800, color: '#B42318', fontSize: '1.125rem' }}>50 – 74</div>
              <div style={{ fontWeight: 700, color: '#B42318', fontSize: '0.875rem', marginTop: '0.25rem' }}>HIGH RISK</div>
              <p style={{ fontSize: '0.8125rem', color: '#B42318', marginTop: '0.5rem', lineHeight: 1.5 }}>
                High statistical fraud probability or multiple red-flag scam indicators triggered.
              </p>
            </div>

            <div style={{ padding: '1.25rem', borderRadius: '10px', backgroundColor: '#FEE4E2', border: '1px solid #FDA29B' }}>
              <div style={{ fontWeight: 800, color: '#912018', fontSize: '1.125rem' }}>75 – 100</div>
              <div style={{ fontWeight: 700, color: '#912018', fontSize: '0.875rem', marginTop: '0.25rem' }}>CRITICAL FRAUD</div>
              <p style={{ fontSize: '0.8125rem', color: '#912018', marginTop: '0.5rem', lineHeight: 1.5 }}>
                Explicit severe fraud indicators: advance fees, fake checks, or fraudulent infrastructure.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* Section 4: What AuthentiHire Does NOT Claim */}
        <AnimatedSection style={{ marginBottom: '4rem' }}>
          <div style={{ padding: '2rem', borderRadius: '16px', backgroundColor: '#F8FAFC', border: '1px solid #EAECF0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <AlertTriangle size={22} color="#F79009" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B1F3A', margin: 0 }}>
                Transparent Limitations & Operational Boundaries
              </h3>
            </div>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9375rem', color: '#475467', lineHeight: 1.6 }}>
              <li>
                <strong>No legal guarantee:</strong> AuthentiHire is an assistive screening tool. A "Low Risk" rating does not constitute a legal or contractual employment endorsement.
              </li>
              <li>
                <strong>Absence of evidence is not proof:</strong> An unavailable website or newly registered startup domain does not automatically constitute fraud.
              </li>
              <li>
                <strong>Zero data fabrication:</strong> If an external verification signal (e.g., DNS or WHOIS) is unreachable, AuthentiHire records it neutrally as <code>UNAVAILABLE</code> rather than fabricating results.
              </li>
            </ul>
          </div>
        </AnimatedSection>

        {/* Bottom CTA */}
        <div style={{ textAlign: 'center', paddingTop: '2rem', borderTop: '1px solid #EAECF0' }}>
          <Link
            to="/how-it-works"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              backgroundColor: '#1677FF',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.9375rem',
              textDecoration: 'none',
            }}
          >
            <span>Explore Technical Architecture</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};
