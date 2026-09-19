import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  Share2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Building,
  Mail,
  Lock,
  Globe,
  DollarSign,
  Clock,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { JobAnalysisResponse, JobPostingRequest } from '../types/api';

interface ResultsDashboardProps {
  data: JobAnalysisResponse;
  originalRequest: JobPostingRequest;
  onNewAnalysis: () => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  data,
  originalRequest,
  onNewAnalysis,
}) => {
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const {
    prediction,
    risk,
    company,
    rules,
    recommendations,
    reasons,
    corroborations,
    metadata,
  } = data;

  const score = risk.overall_score;
  const fraudPercent = Math.round(prediction.fraud_probability * 100);
  const trustScore = company.trust_score;

  // Semantic styling helper based on risk level
  const getRiskTheme = (band: string) => {
    switch (band) {
      case 'LOW RISK':
        return {
          color: 'var(--color-risk-low)',
          text: 'var(--color-risk-low-text)',
          bg: 'var(--color-risk-low-bg)',
          border: 'var(--color-risk-low-border)',
          badgeClass: 'badge-low',
          summary: 'Low risk indicators detected. Standard caution applies.',
        };
      case 'MODERATE RISK':
        return {
          color: 'var(--color-risk-moderate)',
          text: 'var(--color-risk-moderate-text)',
          bg: 'var(--color-risk-moderate-bg)',
          border: 'var(--color-risk-moderate-border)',
          badgeClass: 'badge-moderate',
          summary: 'Moderate risk indicators. Review recruiter details before applying.',
        };
      case 'HIGH RISK':
        return {
          color: 'var(--color-risk-high)',
          text: 'var(--color-risk-high-text)',
          bg: 'var(--color-risk-high-bg)',
          border: 'var(--color-risk-high-border)',
          badgeClass: 'badge-high',
          summary: 'Multiple indicators require your attention.',
        };
      case 'CRITICAL RISK':
      default:
        return {
          color: 'var(--color-risk-critical)',
          text: 'var(--color-risk-critical-text)',
          bg: 'var(--color-risk-critical-bg)',
          border: 'var(--color-risk-critical-border)',
          badgeClass: 'badge-critical',
          summary: 'Critical scam signals identified. Do not share payment or credentials.',
        };
    }
  };

  const theme = getRiskTheme(risk.risk_band);

  const handleShare = () => {
    const summary = `AuthentiHire Risk Assessment: ${risk.overall_score}/100 (${risk.risk_band}). Calibrated ML Fraud Probability: ${fraudPercent}%. Company Trust: ${trustScore}/100.`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadReport = () => {
    const reportText = `AUTHENTIHIRE FRAUD-RISK ASSESSMENT REPORT
==========================================
Report ID: ${data.request_id}
Generated: ${metadata.timestamp}
Model Version: ${metadata.model_version}

OVERALL RISK ASSESSMENT
-----------------------
Overall Risk Score:    ${score} / 100
Risk Band:             ${risk.risk_band}
Assessment Status:     ${risk.status}

MACHINE LEARNING ESTIMATE
-------------------------
Calibrated Fraud Prob: ${fraudPercent}% (${prediction.fraud_probability.toFixed(4)})
Classification:        ${prediction.prediction}
Model Type:            ${prediction.model_name}
Decision Threshold:    ${prediction.threshold_used}

COMPANY & WEBSITE TRUST
-----------------------
Company Name:          ${company.company_name || 'Unidentified'}
Trust Score:           ${trustScore} / 100
Domain:                ${company.domain || 'Not provided'}
Recruiter Email:       ${company.email || 'Not provided'}
Consistency Rating:    ${company.consistency_rating}

TRIGGERED HEURISTIC RULES (${rules.triggered_rules_count})
-------------------------
${rules.triggered_rules.map((r, i) => `${i + 1}. [${r.rule_id}] ${r.rule_name} (${r.severity}, +${r.score})\n   Evidence: "${r.evidence}"\n   Explanation: ${r.explanation}`).join('\n\n') || 'None'}

RECOMMENDED ACTIONS
-------------------
${recommendations}

==========================================
AuthentiHire © 2026 - Commercial Fraud Intelligence`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AuthentiHire_Report_${data.request_id.slice(0, 8)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper for evidence icons
  const getRuleIcon = (category: string, ruleId: string) => {
    if (ruleId.startsWith('PAY')) return <DollarSign size={16} />;
    if (ruleId.startsWith('FIN')) return <Lock size={16} />;
    if (ruleId.startsWith('MSG')) return <Mail size={16} />;
    if (ruleId.startsWith('URG')) return <Clock size={16} />;
    if (category.includes('URL') || category.includes('Domain')) return <Globe size={16} />;
    return <AlertTriangle size={16} />;
  };

  return (
    <section style={{
      paddingTop: '2rem',
      paddingBottom: '5rem',
    }}>
      <div className="container" style={{ maxWidth: 'var(--container-results-width)' }}>

        {/* Top Navigation & Action Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}>
          {/* New Analysis Link */}
          <button
            onClick={onNewAnalysis}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              color: 'var(--color-text-tertiary)',
              fontSize: '0.875rem',
              fontWeight: 'var(--font-weight-medium)',
              transition: 'color var(--transition-fast)',
            }}
          >
            <ArrowLeft size={16} />
            <span>New analysis</span>
          </button>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleDownloadReport}
              className="btn-secondary"
              style={{
                fontSize: '0.8125rem',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <Download size={14} />
              <span>Download Report</span>
            </button>

            <button
              onClick={handleShare}
              className="btn-secondary"
              style={{
                fontSize: '0.8125rem',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              {copied ? <Check size={14} color="var(--color-risk-low)" /> : <Share2 size={14} />}
              <span>{copied ? 'Copied summary!' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Page Title & Subtitle */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-navy-dark)',
            marginBottom: '0.375rem',
          }}>
            Analysis Results
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.9375rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Here&apos;s the complete risk assessment for this job posting.
            </p>
            {data.analysis_id && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-risk-low-text)',
                backgroundColor: 'var(--color-risk-low-bg)',
                padding: '0.25rem 0.625rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-risk-low-border)',
              }}>
                <CheckCircle2 size={12} />
                <span>Analysis saved</span>
              </span>
            )}
          </div>
        </div>

        {/* Insufficient Evidence Notice if applicable */}
        {risk.status === 'INSUFFICIENT_EVIDENCE' && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '1rem',
            padding: '1.25rem 1.5rem',
            backgroundColor: 'var(--color-info-bg)',
            border: '1px solid var(--color-info-border)',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '1.75rem',
          }}>
            <HelpCircle size={22} color="var(--color-info-text)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-dark)', marginBottom: '0.25rem' }}>
                Not enough evidence for definitive classification
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                The job details were too brief or lacked company metadata to perform a high-confidence assessment. Add more details such as the company name, website URL, or fuller job text to improve accuracy.
              </p>
            </div>
          </div>
        )}

        {/* Top Metrics Row: Main Risk Card (Left) + 2 Stat Cards (Right) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.5rem',
          marginBottom: '1.75rem',
        }} className="results-top-grid">

          {/* Main Risk Card */}
          <div className="card-base" style={{ padding: '2rem' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-tertiary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Overall Risk Score
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}>
              {/* Score Number */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                <span style={{
                  fontSize: 'clamp(3rem, 5vw, 4rem)',
                  fontWeight: 800,
                  lineHeight: 1,
                  color: 'var(--color-navy-dark)',
                  letterSpacing: '-0.03em',
                }}>
                  {score}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-tertiary)' }}>
                  / 100
                </span>
              </div>

              {/* Risk Alert Pill */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.25rem',
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.875rem',
                  backgroundColor: theme.bg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 'var(--radius-md)',
                  color: theme.text,
                  fontWeight: 'var(--font-weight-bold)',
                  fontSize: '0.875rem',
                }}>
                  <AlertTriangle size={16} />
                  <span>{risk.risk_band}</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                  {theme.summary}
                </span>
              </div>
            </div>

            {/* Horizontal Segmented Risk Scale Bar */}
            <div style={{ marginTop: '1.5rem', position: 'relative' }}>
              {/* Score Pin Marker */}
              <div style={{
                position: 'relative',
                height: '1.75rem',
                marginBottom: '0.25rem',
              }}>
                <div style={{
                  position: 'absolute',
                  left: `clamp(12px, ${score}%, calc(100% - 14px))`,
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'left 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}>
                  <div style={{
                    backgroundColor: 'var(--color-navy-dark)',
                    color: '#FFFFFF',
                    fontSize: '0.6875rem',
                    fontWeight: 'var(--font-weight-bold)',
                    padding: '0.125rem 0.375rem',
                    borderRadius: 'var(--radius-xs)',
                    lineHeight: 1.2,
                  }}>
                    {score}
                  </div>
                  <div style={{
                    width: 0,
                    height: 0,
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: '4px solid var(--color-navy-dark)',
                  }} />
                </div>
              </div>

              {/* 4 Color Segments */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '3px',
                height: '8px',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
                backgroundColor: '#E4E7EC',
              }}>
                <div style={{ backgroundColor: 'var(--color-risk-low)' }} title="0 - 24: LOW RISK" />
                <div style={{ backgroundColor: 'var(--color-risk-moderate)' }} title="25 - 49: MODERATE RISK" />
                <div style={{ backgroundColor: 'var(--color-risk-high)' }} title="50 - 74: HIGH RISK" />
                <div style={{ backgroundColor: 'var(--color-risk-critical)' }} title="75 - 100: CRITICAL RISK" />
              </div>

              {/* Scale Labels */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                fontSize: '0.6875rem',
                color: 'var(--color-text-tertiary)',
                fontWeight: 'var(--font-weight-semibold)',
                marginTop: '0.5rem',
                textAlign: 'center',
              }}>
                <div>LOW (0-24)</div>
                <div>MODERATE (25-49)</div>
                <div>HIGH (50-74)</div>
                <div>CRITICAL (75+)</div>
              </div>
            </div>
          </div>

          {/* Right Metrics Cards Column */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            {/* Stat Card 1: Fraud Probability */}
            <div className="card-base" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem' }}>
                Fraud Probability
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: fraudPercent >= 50 ? 'var(--color-risk-high-text)' : 'var(--color-navy-dark)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}>
                  {fraudPercent}%
                </span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-tertiary)' }}>
                  ({prediction.prediction})
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Calibrated ML statistical estimate
              </div>
            </div>

            {/* Stat Card 2: Company Trust Score */}
            <div className="card-base" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-tertiary)', marginBottom: '0.5rem' }}>
                Company Trust Score
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginBottom: '0.25rem' }}>
                <span style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: trustScore >= 70 ? 'var(--color-risk-low-text)' : 'var(--color-navy-dark)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                }}>
                  {trustScore}
                </span>
                <span style={{ fontSize: '1.125rem', color: 'var(--color-text-tertiary)', fontWeight: 'var(--font-weight-medium)' }}>
                  / 100
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Available verification evidence
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Split Layout: "Why we flagged this" (Left) + Company & Recommendations (Right) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '1.5rem',
          marginBottom: '2rem',
        }} className="results-bottom-grid">

          {/* Left Column: Why We Flagged This */}
          <div className="card-base" style={{ padding: '1.75rem' }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-navy-dark)',
              marginBottom: '1.25rem',
            }}>
              Why we flagged this
            </h3>

            {/* Evidence List */}
            {rules.triggered_rules.length === 0 && company.signals.length === 0 ? (
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'var(--color-risk-low-bg)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-risk-low-text)',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
              }}>
                <CheckCircle2 size={20} />
                <span>No severe scam heuristics or high-risk signals triggered in this posting.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Render Triggered Scam Rules */}
                {rules.triggered_rules.map((rule, idx) => (
                  <div
                    key={`rule-${idx}`}
                    style={{
                      padding: '1rem 1.125rem',
                      backgroundColor: 'var(--color-bg-card-subtle)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          color: rule.severity === 'CRITICAL' || rule.severity === 'HIGH' ? 'var(--color-risk-high)' : 'var(--color-risk-moderate)',
                          display: 'flex',
                          alignItems: 'center',
                        }}>
                          {getRuleIcon(rule.category, rule.rule_id)}
                        </div>
                        <span style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                          {rule.rule_name}
                        </span>
                      </div>

                      {/* Severity & Source Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span className={`badge ${rule.severity === 'CRITICAL' || rule.severity === 'HIGH' ? 'badge-high' : 'badge-moderate'}`} style={{ fontSize: '0.6875rem' }}>
                          {rule.severity}
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                          Rule
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                      {rule.explanation}
                    </p>

                    {rule.evidence && (
                      <div style={{
                        fontSize: '0.75rem',
                        fontStyle: 'italic',
                        color: 'var(--color-text-tertiary)',
                        backgroundColor: '#FFFFFF',
                        padding: '0.375rem 0.625rem',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--color-border-subtle)',
                      }}>
                        &ldquo;{rule.evidence}&rdquo;
                      </div>
                    )}
                  </div>
                ))}

                {/* Render Company Signals */}
                {company.signals.map((sig, idx) => (
                  <div
                    key={`sig-${idx}`}
                    style={{
                      padding: '1rem 1.125rem',
                      backgroundColor: 'var(--color-bg-card-subtle)',
                      border: '1px solid var(--color-border-subtle)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={16} color="var(--color-risk-moderate)" />
                        <span style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                          {sig.category}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <span className="badge badge-moderate" style={{ fontSize: '0.6875rem' }}>
                          MEDIUM
                        </span>
                        <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                          Company
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', lineHeight: 1.45 }}>
                      {sig.description}
                    </p>
                    {sig.evidence && (
                      <div style={{
                        fontSize: '0.75rem',
                        fontStyle: 'italic',
                        color: 'var(--color-text-tertiary)',
                        backgroundColor: '#FFFFFF',
                        padding: '0.375rem 0.625rem',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--color-border-subtle)',
                      }}>
                        &ldquo;{sig.evidence}&rdquo;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Corroboration Synthesis Callout if present */}
            {corroborations && corroborations.length > 0 && (
              <div style={{
                marginTop: '1.25rem',
                padding: '0.875rem 1rem',
                backgroundColor: 'var(--color-primary-blue-subtle)',
                border: '1px solid var(--color-primary-blue-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                color: 'var(--color-navy-dark)',
              }}>
                {corroborations.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                    <ShieldCheck size={16} color="var(--color-primary-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Company Verification + Recommendations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Company Verification Card */}
            <div className="card-base" style={{ padding: '1.75rem' }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-navy-dark)',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <Building size={18} color="var(--color-primary-blue)" />
                <span>Company verification</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {/* 1. Company Identified */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <Building size={14} />
                    <span>Company identified</span>
                  </div>
                  <span className={`badge ${company.company_name ? 'badge-low' : 'badge-neutral'}`}>
                    {company.company_name ? 'Identified' : 'Not specified'}
                  </span>
                </div>

                {/* 2. Website Reachable */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <Globe size={14} />
                    <span>Website reachable</span>
                  </div>
                  <span className={`badge ${company.domain ? 'badge-low' : 'badge-neutral'}`}>
                    {company.domain ? 'Reachable' : 'Not available'}
                  </span>
                </div>

                {/* 3. HTTPS / TLS */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <Lock size={14} />
                    <span>HTTPS / TLS</span>
                  </div>
                  <span className={`badge ${company.domain ? 'badge-low' : 'badge-neutral'}`}>
                    {company.domain ? 'Valid certificate' : 'Not verified'}
                  </span>
                </div>

                {/* 4. Email / Domain Match */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <Mail size={14} />
                    <span>Email / domain match</span>
                  </div>
                  <span className={`badge ${company.consistency_rating === 'HIGH' ? 'badge-low' : company.consistency_rating === 'MISMATCH' ? 'badge-high' : 'badge-moderate'}`}>
                    {company.consistency_rating === 'HIGH' ? 'Match' : company.consistency_rating === 'MISMATCH' ? 'Mismatch' : 'Unverified'}
                  </span>
                </div>

                {/* 5. Company Reputation / Evidence */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)' }}>
                    <ShieldCheck size={14} />
                    <span>Company evidence</span>
                  </div>
                  <span className={`badge ${trustScore >= 70 ? 'badge-low' : trustScore >= 40 ? 'badge-moderate' : 'badge-neutral'}`}>
                    {trustScore >= 70 ? 'Established' : trustScore >= 40 ? 'Moderate evidence' : 'Limited evidence'}
                  </span>
                </div>
              </div>

              {/* Company Note */}
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted)',
                marginTop: '1.25rem',
                paddingTop: '0.875rem',
                borderTop: '1px solid var(--color-border-subtle)',
              }}>
                This score summarizes available company-verification evidence. It is not a probability that the company is legitimate.
              </div>
            </div>

            {/* Recommendations Card */}
            <div className="card-base" style={{ padding: '1.75rem' }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-navy-dark)',
                marginBottom: '1rem',
              }}>
                Recommendations
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                  <span style={{ color: 'var(--color-primary-blue)', fontWeight: 'bold' }}>•</span>
                  <span>{recommendations}</span>
                </div>

                {reasons && reasons.slice(0, 3).map((reason, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>•</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Expandable "View job details" Section */}
        <div className="card-base" style={{ padding: '1.5rem 1.75rem' }}>
          <button
            onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              fontSize: '0.9375rem',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-navy-dark)',
            }}
            aria-expanded={isDetailsExpanded}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} color="var(--color-primary-blue)" />
              <span>View submitted job details</span>
            </div>
            {isDetailsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {isDetailsExpanded && (
            <div style={{
              marginTop: '1.25rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--color-border-subtle)',
            }}>
              {/* Metadata Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.875rem',
                marginBottom: '1.25rem',
                fontSize: '0.8125rem',
              }}>
                {originalRequest.company_name && (
                  <div>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Company: </span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{originalRequest.company_name}</strong>
                  </div>
                )}
                {originalRequest.recruiter_email && (
                  <div>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Email: </span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{originalRequest.recruiter_email}</strong>
                  </div>
                )}
                {originalRequest.url && (
                  <div>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Website: </span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{originalRequest.url}</strong>
                  </div>
                )}
                {originalRequest.location && (
                  <div>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Location: </span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{originalRequest.location}</strong>
                  </div>
                )}
                {originalRequest.employment_type && (
                  <div>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Type: </span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{originalRequest.employment_type}</strong>
                  </div>
                )}
                {originalRequest.salary_range && (
                  <div>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>Salary: </span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>{originalRequest.salary_range}</strong>
                  </div>
                )}
              </div>

              {/* Text Description Box */}
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-tertiary)', marginBottom: '0.375rem' }}>
                  Raw Job Description Text:
                </span>
                <div style={{
                  backgroundColor: 'var(--color-bg-card-subtle)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid var(--color-border-subtle)',
                }}>
                  {originalRequest.description}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      <style>{`
        @media (min-width: 992px) {
          .results-top-grid {
            grid-template-columns: 1.35fr 0.65fr !important;
          }
          .results-bottom-grid {
            grid-template-columns: 1.15fr 0.85fr !important;
          }
        }
      `}</style>
    </section>
  );
};
