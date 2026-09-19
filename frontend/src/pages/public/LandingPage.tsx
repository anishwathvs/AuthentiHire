import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  ArrowRight,
  Cpu,
  FileWarning,
  Globe,
  CheckCircle,
  AlertTriangle,
  Mail,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AnimatedSection } from '../../components/ui/AnimatedSection';

// Narrative Visual Assets
import heroJobseekerImg from '../../assets/images/hero_jobseeker.jpg';
import scrutinyAnalysisImg from '../../assets/images/scrutiny_analysis.jpg';
import multiSignalDiagramImg from '../../assets/images/multisignal_diagram.jpg';
import scamAlertImg from '../../assets/images/scam_alert_redflags.jpg';
import companyResearchImg from '../../assets/images/company_research.jpg';
import confidentApplicantImg from '../../assets/images/confident_applicant.jpg';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ overflow: 'hidden' }}>
      {/* ========================================================================= */}
      {/* 1. HERO SECTION (EDITORIAL PHOTOGRAPHY + NARRATIVE) */}
      {/* ========================================================================= */}
      <section
        style={{
          position: 'relative',
          padding: '4.5rem 1.5rem 6rem',
          backgroundColor: '#FFFFFF',
          backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(37, 99, 235, 0.08), transparent)',
          borderBottom: '1px solid #EAECF0',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '4rem',
            alignItems: 'center',
          }}
        >
          {/* Left Column: Headline & Action */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.375rem 0.875rem',
                borderRadius: '9999px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                color: '#2563EB',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: '1.25rem',
              }}
            >
              <ShieldCheck size={14} />
              <span>EVIDENCE-BASED JOB FRAUD DETECTION</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.85rem)',
                fontWeight: 800,
                letterSpacing: '-0.035em',
                lineHeight: 1.1,
                color: '#0F172A',
                marginBottom: '1.25rem',
              }}
            >
              Know the risk <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                before you apply.
              </span>
            </h1>

            <p
              style={{
                fontSize: '1.125rem',
                lineHeight: 1.6,
                color: '#475467',
                marginBottom: '2rem',
                maxWidth: '520px',
              }}
            >
              AuthentiHire empowers job seekers, graduates, and professionals to inspect job postings with calibrated machine learning, scam rule heuristics, and live employer domain intelligence.
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <Link
                to={isAuthenticated ? '/app/analyze' : '/login'}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.75rem',
                  borderRadius: '10px',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Analyze a posting</span>
                <ArrowRight size={16} />
              </Link>

              <Link
                to="/how-it-works"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '10px',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textDecoration: 'none',
                  border: '1px solid #D0D5DD',
                  boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>See how it works</span>
              </Link>
            </div>

            {/* 3 Trust Points */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1rem',
                marginTop: '2.5rem',
                paddingTop: '1.75rem',
                borderTop: '1px solid #EAECF0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054', lineHeight: 1.35 }}>
                  Evidence-based insights
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054', lineHeight: 1.35 }}>
                  Calibrated ML models
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <CheckCircle size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#344054', lineHeight: 1.35 }}>
                  Explainable risk reports
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: High Quality Editorial Photo */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                backgroundColor: '#F8FAFC',
              }}
            >
              <img
                src={heroJobseekerImg}
                alt="Job seeker reviewing an online job posting with AuthentiHire"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
              
              {/* Floating Trust Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '1.25rem',
                  left: '1.25rem',
                  right: '1.25rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.94)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: '12px',
                  padding: '1rem 1.25rem',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(226, 232, 240, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      backgroundColor: '#EFF6FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheck size={20} color="#2563EB" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A' }}>
                      Multi-Signal Inspection Active
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      ML Classifier • Scam Heuristics • Domain DNS
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.625rem',
                    borderRadius: '9999px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Verified Engine
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SECTION: THE PROBLEM — ONE PREDICTION ISN'T ENOUGH */}
      {/* ========================================================================= */}
      <AnimatedSection
        style={{
          padding: '6rem 1.5rem',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #EAECF0',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '4rem',
            alignItems: 'center',
          }}
        >
          {/* Left Text */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: '1rem',
              }}
            >
              Multi-Signal Architecture
            </div>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                marginBottom: '1.25rem',
              }}
            >
              One prediction isn't enough.
            </h2>
            <p
              style={{
                fontSize: '1.0625rem',
                color: '#475467',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}
            >
              A single raw AI score is opaque and untrustworthy. Scammers today copy real job descriptions, mimic executive names, and set up realistic company websites. AuthentiHire unifies three distinct, corroborating layers to explain exactly why a posting carries risk.
            </p>
            <p
              style={{
                fontSize: '1rem',
                color: '#64748B',
                lineHeight: 1.6,
                marginBottom: '2rem',
              }}
            >
              AuthentiHire replaces blind trust with transparent, evidence-backed inspection. We dissect language subtleties, match specific fraud patterns, and verify corporate domain infrastructure.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EAECF0' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#DC2626', marginBottom: '0.25rem' }}>$2.7B+</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>Lost annually to employment and job recruiting scams</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #EAECF0' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563EB', marginBottom: '0.25rem' }}>3 Layers</div>
                <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>Corroborating inspection signals for every analyzed posting</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div>
            <div
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                backgroundColor: '#FFFFFF',
              }}
            >
              <img
                src={scrutinyAnalysisImg}
                alt="Detailed employment contract and posting scrutiny"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ========================================================================= */}
      {/* 3. SECTION: THREE INSPECTION PILLARS & ARCHITECTURE */}
      {/* ========================================================================= */}
      <AnimatedSection
        style={{
          padding: '6rem 1.5rem',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #EAECF0',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: '1rem',
              }}
            >
              Technical Rigor
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
              Three independent layers of defense.
            </h2>
            <p style={{ fontSize: '1.0625rem', color: '#64748B', marginTop: '0.75rem', lineHeight: 1.6 }}>
              AuthentiHire synchronizes machine learning probability calibration, deterministic scam heuristics, and live corporate domain checks into a single unified risk score.
            </p>
          </div>

          {/* Architecture Vector Illustration */}
          <div
            style={{
              maxWidth: '880px',
              margin: '0 auto 4rem',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 12px 30px -10px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
              backgroundColor: '#F8FAFC',
            }}
          >
            <img
              src={multiSignalDiagramImg}
              alt="AuthentiHire Multi-Signal Architecture: Job Posting to ML, Rules, Domain checks to Verification Shield"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>

          {/* Three Detailed Pillar Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {/* Pillar 1: Calibrated ML */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '2rem',
                border: '1px solid #EAECF0',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.05)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Cpu size={22} color="#2563EB" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                Calibrated Machine Learning
              </h3>
              <p style={{ fontSize: '0.9375rem', color: '#475467', lineHeight: 1.6, marginBottom: '1.5rem', flex: 1 }}>
                Trained on thousands of real-world verified fraudulent and legitimate job postings using TF-IDF n-grams with Platt probability calibration to yield true statistical risk probabilities.
              </p>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #EAECF0', fontSize: '0.8125rem', color: '#475467' }}>
                <strong>Metric:</strong> Calibrated Fraud Probability (0.00 – 1.00)
              </div>
            </div>

            {/* Pillar 2: Heuristic Rules */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '2rem',
                border: '1px solid #EAECF0',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.05)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: '#FEF2F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <FileWarning size={22} color="#DC2626" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                Deterministic Scam Rules
              </h3>
              <p style={{ fontSize: '0.9375rem', color: '#475467', lineHeight: 1.6, marginBottom: '1.5rem', flex: 1 }}>
                Identifies high-threat patterns: upfront equipment payments, fake cashier checks, cryptocurrency transfers, Telegram/WhatsApp interviews, and urgency pressure phrases.
              </p>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #EAECF0', fontSize: '0.8125rem', color: '#475467' }}>
                <strong>Metric:</strong> Triggered Rule Flags & Extracted Snippets
              </div>
            </div>

            {/* Pillar 3: Domain & Company Intelligence */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '2rem',
                border: '1px solid #EAECF0',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.05)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: '#ECFDF5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <Globe size={22} color="#059669" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                Company & Website Intelligence
              </h3>
              <p style={{ fontSize: '0.9375rem', color: '#475467', lineHeight: 1.6, marginBottom: '1.5rem', flex: 1 }}>
                Performs active DNS resolution, MX mail server verification, free mail provider detection, and domain age checks to confirm employer legitimacy.
              </p>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #EAECF0', fontSize: '0.8125rem', color: '#475467' }}>
                <strong>Metric:</strong> Company Trust Score (1 – 100) & Alignment
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ========================================================================= */}
      {/* 4. SECTION: COMMON SCAM VECTORS & RED FLAGS */}
      {/* ========================================================================= */}
      <AnimatedSection
        style={{
          padding: '6rem 1.5rem',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #EAECF0',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '4rem',
            alignItems: 'center',
          }}
        >
          {/* Left Image */}
          <div>
            <div
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                backgroundColor: '#FFFFFF',
              }}
            >
              <img
                src={scamAlertImg}
                alt="Analyst reviewing suspicious email and job scam warning indicators"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>

          {/* Right Text: Red Flag Examples */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: '1rem',
              }}
            >
              Recognize the Danger
            </div>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                marginBottom: '1.25rem',
              }}
            >
              Red flags that AuthentiHire catches immediately.
            </h2>
            <p
              style={{
                fontSize: '1.0625rem',
                color: '#475467',
                lineHeight: 1.6,
                marginBottom: '2rem',
              }}
            >
              Scammers rely on excitement and urgency to cloud judgment. Our deterministic rules detect the specific markers of fraudulent campaigns.
            </p>

            {/* List of 3 Red Flag Markers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  padding: '1rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #EAECF0',
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <AlertTriangle size={16} color="#DC2626" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
                    Advance Fee & Equipment Check Scams
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5 }}>
                    "We will send you a cashier's check to purchase home office hardware from our authorized vendor."
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  padding: '1rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #EAECF0',
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Mail size={16} color="#DC2626" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
                    Unofficial Communications & Free Mail
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5 }}>
                    Recruiters claiming to represent enterprise brands while communicating from personal Gmail, Outlook, or Telegram accounts.
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  padding: '1rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #EAECF0',
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  <Zap size={16} color="#DC2626" />
                </div>
                <div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.25rem' }}>
                    Immediate Unconditional Offers
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5 }}>
                    Hiring decisions made without technical interviews, portfolio review, or live video screenings.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ========================================================================= */}
      {/* 5. SECTION: COMPANY & WEBSITE INTELLIGENCE */}
      {/* ========================================================================= */}
      <AnimatedSection
        style={{
          padding: '6rem 1.5rem',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #EAECF0',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '4rem',
            alignItems: 'center',
          }}
        >
          {/* Left Text */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: '1rem',
              }}
            >
              Domain Verification
            </div>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                marginBottom: '1.25rem',
              }}
            >
              Verify the employer behind the listing.
            </h2>
            <p
              style={{
                fontSize: '1.0625rem',
                color: '#475467',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}
            >
              AuthentiHire checks real DNS infrastructure to ensure the company domain exists, operates active mail exchanges (MX), and matches the contact email provided by the recruiter.
            </p>
            <p
              style={{
                fontSize: '1rem',
                color: '#64748B',
                lineHeight: 1.6,
                marginBottom: '2rem',
              }}
            >
              If a recruiter claims to be from Microsoft or Stripe but contacts you from a lookalike domain created last week, AuthentiHire alerts you instantly.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <CheckCircle size={18} color="#059669" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Live DNS A & AAAA record resolution</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <CheckCircle size={18} color="#059669" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Valid MX record verification for mail integrity</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <CheckCircle size={18} color="#059669" />
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Domain-to-recruiter email consistency scoring</span>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div>
            <div
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                backgroundColor: '#FFFFFF',
              }}
            >
              <img
                src={companyResearchImg}
                alt="Employer background research and company verification analytics"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ========================================================================= */}
      {/* 6. SECTION: UNDERSTAND THE RESULT (AUTHENTIC PRODUCT UI SHOWCASE) */}
      {/* ========================================================================= */}
      <AnimatedSection
        style={{
          padding: '6rem 1.5rem',
          backgroundColor: '#F8FAFC',
          borderBottom: '1px solid #EAECF0',
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: '1rem',
              }}
            >
              Transparent Results
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.75rem)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
              Clear, actionable risk reports.
            </h2>
            <p style={{ fontSize: '1.0625rem', color: '#64748B', marginTop: '0.75rem' }}>
              Every analysis produces an explainable dossier with concrete findings, evidence snippets, and specific verification steps.
            </p>
          </div>

          {/* Pure React UI Showcase Card */}
          <div
            style={{
              maxWidth: '960px',
              margin: '0 auto',
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              border: '1px solid #EAECF0',
              boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(15, 23, 42, 0.04)',
              overflow: 'hidden',
            }}
          >
            {/* Header bar */}
            <div
              style={{
                padding: '1.25rem 2rem',
                backgroundColor: '#F8FAFC',
                borderBottom: '1px solid #EAECF0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  SAMPLE ANALYSIS REPORT
                </div>
                <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0F172A', marginTop: '0.125rem' }}>
                  Remote Executive Assistant & Data Entry • Global Horizons Tech LLC
                </div>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.375rem 0.875rem',
                  borderRadius: '9999px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  color: '#DC2626',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                }}
              >
                <AlertTriangle size={15} />
                <span>HIGH RISK (78 / 100)</span>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '2rem' }}>
              {/* 3 Metric Summary Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '2rem',
                }}
              >
                <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991B1B' }}>ML FRAUD PROBABILITY</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#DC2626', marginTop: '0.25rem' }}>84.2%</div>
                  <div style={{ fontSize: '0.75rem', color: '#B91C1C', marginTop: '0.25rem' }}>Calibrated Logistic Regression</div>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: '#FFFBEB', border: '1px solid #FEF3C7' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400E' }}>HEURISTIC RULES TRIGGERED</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#D97706', marginTop: '0.25rem' }}>3 Flags</div>
                  <div style={{ fontSize: '0.75rem', color: '#B45309', marginTop: '0.25rem' }}>Advance fee & Telegram interview</div>
                </div>

                <div style={{ padding: '1.25rem', borderRadius: '12px', backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40AF' }}>COMPANY TRUST SCORE</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563EB', marginTop: '0.25rem' }}>32 / 100</div>
                  <div style={{ fontSize: '0.75rem', color: '#1D4ED8', marginTop: '0.25rem' }}>Free email domain mismatch</div>
                </div>
              </div>

              {/* Evidence Snippet Breakdown */}
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #EAECF0', padding: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0F172A', marginBottom: '1rem' }}>
                  Detected Evidence & High-Risk Indicators
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.8125rem' }}>
                    <AlertTriangle size={15} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: '#0F172A' }}>Advance Fee / Equipment Check Pattern:</strong>
                      <span style={{ color: '#475467', marginLeft: '0.375rem' }}>
                        "Company will issue a $2,500 check for your home workstation setup before day one."
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.8125rem' }}>
                    <AlertTriangle size={15} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: '#0F172A' }}>Unofficial Interview Platform:</strong>
                      <span style={{ color: '#475467', marginLeft: '0.375rem' }}>
                        "Contact hiring manager Mrs. Sarah via Telegram ID @GlobalRecruitHR for instant screening."
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.8125rem' }}>
                    <AlertTriangle size={15} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong style={{ color: '#0F172A' }}>Domain Identity Mismatch:</strong>
                      <span style={{ color: '#475467', marginLeft: '0.375rem' }}>
                        Recruiter contact address is <code style={{ backgroundColor: '#F1F5F9', padding: '1px 4px', borderRadius: '4px' }}>hr-globalhorizons@gmail.com</code> instead of official corporate domain.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actionable recommendation */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '0.875rem' }}>
                  <CheckCircle size={16} color="#059669" />
                  <span>Recommendation: <strong>Do not deposit checks or share SSN/banking information.</strong></span>
                </div>
                <Link
                  to={isAuthenticated ? '/app/analyze' : '/login'}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: '#2563EB',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                  }}
                >
                  <span>Test with your own job posting</span>
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ========================================================================= */}
      {/* 7. SECTION: CONFIDENT JOB SEARCH & SAFETY BANNER */}
      {/* ========================================================================= */}
      <AnimatedSection
        style={{
          padding: '6rem 1.5rem',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #EAECF0',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '4rem',
            alignItems: 'center',
          }}
        >
          {/* Left Image: Confident Applicant */}
          <div>
            <div
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.05)',
                backgroundColor: '#FFFFFF',
              }}
            >
              <img
                src={confidentApplicantImg}
                alt="Confident job seeker happily reviewing verified authentic career opportunity"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover',
                }}
              />
            </div>
          </div>

          {/* Right Text: Apply with confidence */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                fontSize: '0.8125rem',
                fontWeight: 600,
                marginBottom: '1rem',
              }}
            >
              Apply With Confidence
            </div>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
                fontWeight: 800,
                color: '#0F172A',
                letterSpacing: '-0.03em',
                lineHeight: 1.2,
                marginBottom: '1.25rem',
              }}
            >
              Focus on winning the job. Let us verify the posting.
            </h2>
            <p
              style={{
                fontSize: '1.0625rem',
                color: '#475467',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}
            >
              Job searching is stressful enough without having to worry about predatory recruiters and identity theft. AuthentiHire gives you the clarity you need to apply confidently and protect your personal information.
            </p>

            <div
              style={{
                padding: '1.25rem',
                borderRadius: '12px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #EAECF0',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                marginBottom: '2rem',
              }}
            >
              <ShieldCheck size={20} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.875rem', color: '#475467', lineHeight: 1.6 }}>
                <strong>AuthentiHire is a screening tool, not a legal guarantee.</strong> While AuthentiHire provides deep intelligence, always maintain healthy vigilance and confirm recruiter credentials through official company channels.
              </div>
            </div>

            <Link
              to={isAuthenticated ? '/app/analyze' : '/register'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.75rem',
                borderRadius: '10px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              }}
            >
              <span>Start Free Analysis</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </AnimatedSection>

      {/* ========================================================================= */}
      {/* 8. FINAL CTA SECTION */}
      {/* ========================================================================= */}
      <AnimatedSection
        style={{
          padding: '6rem 1.5rem',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2.25rem, 4vw, 3rem)', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Ready to inspect your next opportunity?
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#94A3B8', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Join students, job seekers, and career advisors who verify suspicious job postings with evidence-based intelligence.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <Link
              to={isAuthenticated ? '/app/analyze' : '/register'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.75rem',
                borderRadius: '10px',
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              }}
            >
              <span>Create free account</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.875rem 1.75rem',
                borderRadius: '10px',
                backgroundColor: 'transparent',
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '1rem',
                textDecoration: 'none',
                border: '1px solid #334155',
              }}
            >
              <span>Sign in</span>
            </Link>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
};
