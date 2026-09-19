import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  ShieldCheck,
  BarChart2,
  Search,
  Plus,
  ArrowRight,
  Clock,
  Settings,
  Lightbulb,
  Building,
  CheckCircle2,
  XCircle,
  Mail,
  Users,
  Shield,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchDashboardSummary } from '../../api/client';
import { DashboardSummaryResponse } from '../../types/api';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickInput, setQuickInput] = useState('');

  const loadSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardSummary();
      setSummary(data);
    } catch {
      setError('Unable to load dashboard metrics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      navigate('/app/analyze', { state: { initialDescription: quickInput.trim() } });
    } else {
      navigate('/app/analyze');
    }
  };

  const username = user?.email ? user.email.split('@')[0] : 'user';
  const total = summary?.total_analyses || 0;
  const highCritical = (summary?.risk_distribution?.high || 0) + (summary?.risk_distribution?.critical || 0);
  const lowRisk = summary?.risk_distribution?.low || 0;
  const moderateRisk = summary?.risk_distribution?.moderate || 0;
  const highRisk = summary?.risk_distribution?.high || 0;
  const criticalRisk = summary?.risk_distribution?.critical || 0;
  const avgRisk = summary?.average_risk_score !== undefined ? summary.average_risk_score.toFixed(1) : '0.0';

  const lowPct = total > 0 ? ((lowRisk / total) * 100).toFixed(1) : '0.0';
  const modPct = total > 0 ? ((moderateRisk / total) * 100).toFixed(1) : '0.0';
  const highPct = total > 0 ? ((highRisk / total) * 100).toFixed(1) : '0.0';
  const critPct = total > 0 ? ((criticalRisk / total) * 100).toFixed(1) : '0.0';
  const highCriticalPct = total > 0 ? (((highCritical) / total) * 100).toFixed(1) : '0.0';
  const safePct = total > 0 ? ((lowRisk / total) * 100).toFixed(1) : '0.0';

  // SVG Donut Calculations
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const p1 = total > 0 ? (lowRisk / total) * circumference : 0;
  const p2 = total > 0 ? (moderateRisk / total) * circumference : 0;
  const p3 = total > 0 ? (highRisk / total) * circumference : 0;
  const p4 = total > 0 ? (criticalRisk / total) * circumference : 0;

  const o1 = 0;
  const o2 = -p1;
  const o3 = -(p1 + p2);
  const o4 = -(p1 + p2 + p3);

  return (
    <div style={{ padding: '2rem 2.5rem 4rem', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Top Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', margin: 0 }}>
            Welcome back, {username}!
          </h1>
          <p style={{ fontSize: '0.9375rem', color: '#64748B', marginTop: '0.375rem', margin: 0 }}>
            Analyze job and internship postings for potential fraud.
          </p>
        </div>

        {/* Search Input & Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
          <form onSubmit={handleQuickSubmit} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Paste a job posting to analyze..."
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                className="form-input"
                style={{
                  width: '280px',
                  paddingLeft: '2.5rem',
                  paddingRight: '1rem',
                  paddingTop: '0.625rem',
                  paddingBottom: '0.625rem',
                  fontSize: '0.875rem',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                }}
              />
              <Search
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </form>

          <Link
            to="/app/analyze"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              transition: 'background-color 0.15s ease',
            }}
          >
            <Plus size={16} />
            <span>Analyze New Posting</span>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '8rem 0' }}>
          <Loader2 size={36} color="#2563EB" className="animate-spin" />
        </div>
      ) : (
        <>
          {/* Stat Cards Grid (4 Cards) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.25rem',
              marginBottom: '1.75rem',
            }}
            className="dashboard-stat-cards"
          >
            {/* Card 1: Total Postings Analyzed */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #EAECF0',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
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
                  flexShrink: 0,
                }}
              >
                <FileText size={22} color="#2563EB" />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>
                  Total Postings Analyzed
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.15, marginTop: '0.25rem' }}>
                  {total}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10B981', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span>↑ +12 this week</span>
                </div>
              </div>
            </div>

            {/* Card 2: High / Critical Risks */}
            <div
              style={{
                backgroundColor: '#FEF2F2',
                borderRadius: '12px',
                border: '1px solid #FEE2E2',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} color="#EF4444" />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>
                  High / Critical Risks
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#EF4444', lineHeight: 1.15, marginTop: '0.25rem' }}>
                  {highCritical}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#EF4444', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span>↓ {highCriticalPct}% of total</span>
                </div>
              </div>
            </div>

            {/* Card 3: Verified Safe Postings */}
            <div
              style={{
                backgroundColor: '#F0FDF4',
                borderRadius: '12px',
                border: '1px solid #DCFCE7',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: '#DCFCE7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={22} color="#10B981" />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>
                  Verified Safe Postings
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10B981', lineHeight: 1.15, marginTop: '0.25rem' }}>
                  {lowRisk}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10B981', marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <span>↓ {safePct}% of total</span>
                </div>
              </div>
            </div>

            {/* Card 4: Average Risk Score */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #EAECF0',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
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
                  flexShrink: 0,
                }}
              >
                <BarChart2 size={22} color="#2563EB" />
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748B' }}>
                  Average Risk Score
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563EB', lineHeight: 1.15, marginTop: '0.25rem' }}>
                  {avgRisk}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B', marginTop: '0.375rem' }}>
                  Across all analyses
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Risk Distribution + How AuthentiHire Works (2 Cards) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.45fr',
              gap: '1.25rem',
              marginBottom: '1.75rem',
            }}
            className="dashboard-middle-grid"
          >
            {/* Left Card: Risk Distribution */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #EAECF0',
                padding: '1.5rem',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <BarChart2 size={18} color="#475467" />
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Risk Distribution
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', justifyContent: 'space-around' }}>
                {/* SVG Donut Chart */}
                <div style={{ position: 'relative', width: '150px', height: '150px', flexShrink: 0 }}>
                  <svg width="150" height="150" viewBox="0 0 150 150">
                    <g transform="rotate(-90 75 75)">
                      {/* Background circle */}
                      <circle
                        cx="75"
                        cy="75"
                        r={radius}
                        fill="transparent"
                        stroke="#F1F5F9"
                        strokeWidth="18"
                      />
                      {total > 0 ? (
                        <>
                          {/* Segment 1: Low Risk (Green) */}
                          <circle
                            cx="75"
                            cy="75"
                            r={radius}
                            fill="transparent"
                            stroke="#10B981"
                            strokeWidth="18"
                            strokeDasharray={`${p1} ${circumference}`}
                            strokeDashoffset={o1}
                          />
                          {/* Segment 2: Moderate Risk (Yellow/Amber) */}
                          <circle
                            cx="75"
                            cy="75"
                            r={radius}
                            fill="transparent"
                            stroke="#F59E0B"
                            strokeWidth="18"
                            strokeDasharray={`${p2} ${circumference}`}
                            strokeDashoffset={o2}
                          />
                          {/* Segment 3: High Risk (Red) */}
                          <circle
                            cx="75"
                            cy="75"
                            r={radius}
                            fill="transparent"
                            stroke="#EF4444"
                            strokeWidth="18"
                            strokeDasharray={`${p3} ${circumference}`}
                            strokeDashoffset={o3}
                          />
                          {/* Segment 4: Critical Fraud (Crimson) */}
                          <circle
                            cx="75"
                            cy="75"
                            r={radius}
                            fill="transparent"
                            stroke="#991B1B"
                            strokeWidth="18"
                            strokeDasharray={`${p4} ${circumference}`}
                            strokeDashoffset={o4}
                          />
                        </>
                      ) : null}
                    </g>
                  </svg>
                  {/* Center Text */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
                      {total}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#64748B', marginTop: '2px' }}>
                      Total
                    </div>
                  </div>
                </div>

                {/* Legend List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10B981' }} />
                      <span style={{ color: '#334155', fontWeight: 500 }}>Low Risk (0–24)</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{lowRisk} ({lowPct}%)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#F59E0B' }} />
                      <span style={{ color: '#334155', fontWeight: 500 }}>Moderate Risk (25–49)</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{moderateRisk} ({modPct}%)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#EF4444' }} />
                      <span style={{ color: '#334155', fontWeight: 500 }}>High Risk (50–74)</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{highRisk} ({highPct}%)</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#991B1B' }} />
                      <span style={{ color: '#334155', fontWeight: 500 }}>Critical Fraud (75–100)</span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{criticalRisk} ({critPct}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: How AuthentiHire Works */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #EAECF0',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                  <Settings size={18} color="#475467" />
                  <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    How AuthentiHire Works
                  </h2>
                </div>

                {/* 5-Step Process Flow with Icons & Arrows */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.375rem',
                    marginBottom: '1.5rem',
                  }}
                  className="dashboard-how-it-works-flow"
                >
                  {/* Step 1 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#EFF6FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <FileText size={20} color="#2563EB" />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB' }}>1. Input</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Job Posting</div>
                  </div>

                  <div style={{ color: '#CBD5E1', fontSize: '1rem', fontWeight: 600 }}>→</div>

                  {/* Step 2 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#F5F3FF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <FileCheck size={20} color="#8B5CF6" />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>2. AI Analysis</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>(ML + Rules)</div>
                  </div>

                  <div style={{ color: '#CBD5E1', fontSize: '1rem', fontWeight: 600 }}>→</div>

                  {/* Step 3 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#F0FDF4',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <Building size={20} color="#10B981" />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>3. Company</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Verification</div>
                  </div>

                  <div style={{ color: '#CBD5E1', fontSize: '1rem', fontWeight: 600 }}>→</div>

                  {/* Step 4 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#FEF3C7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <ShieldCheck size={20} color="#F59E0B" />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>4. Risk Scoring</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>& Explanation</div>
                  </div>

                  <div style={{ color: '#CBD5E1', fontSize: '1rem', fontWeight: 600 }}>→</div>

                  {/* Step 5 */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: 1 }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        backgroundColor: '#FEF2F2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <FileText size={20} color="#EF4444" />
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>5. Detailed</div>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Report</div>
                  </div>
                </div>
              </div>

              {/* Bottom Amber Callout */}
              <div
                style={{
                  backgroundColor: '#FFFBEB',
                  borderRadius: '8px',
                  border: '1px solid #FEF3C7',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <Lightbulb size={18} color="#D97706" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.8125rem', color: '#92400E', lineHeight: 1.4 }}>
                  Get instant insights about job authenticity using Machine Learning and real-world verification checks.
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Recent Analyses + Quick Tips (2 Cards) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.45fr 1fr',
              gap: '1.25rem',
            }}
            className="dashboard-bottom-grid"
          >
            {/* Left Card: Recent Analyses Table */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #EAECF0',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
              }}
            >
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} color="#475467" />
                  <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Recent Analyses
                  </h2>
                </div>
                <Link
                  to="/app/history"
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: '#2563EB',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <span>View all history →</span>
                </Link>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #EAECF0', color: '#64748B', fontWeight: 600 }}>
                      <th style={{ padding: '0.75rem 1.25rem' }}>Job Title / Company</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Risk Score</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Result</th>
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary?.recent_analyses && summary.recent_analyses.length > 0 ? (
                      summary.recent_analyses.map((item) => {
                        const bandUpper = (item.risk_band || '').toUpperCase();
                        const isLow = bandUpper.includes('LOW');
                        const isMod = bandUpper.includes('MOD');
                        const isHigh = bandUpper.includes('HIGH');
                        const isCrit = bandUpper.includes('CRIT');

                        let scoreBg = '#DCFCE7';
                        let scoreColor = '#10B981';
                        let resultBg = '#DCFCE7';
                        let resultColor = '#10B981';
                        let resultText = 'Likely Safe';

                        if (isCrit) {
                          scoreBg = '#FEE2E2';
                          scoreColor = '#991B1B';
                          resultBg = '#FEE2E2';
                          resultColor = '#991B1B';
                          resultText = 'Critical Risk';
                        } else if (isHigh) {
                          scoreBg = '#FEE2E2';
                          scoreColor = '#EF4444';
                          resultBg = '#FEE2E2';
                          resultColor = '#EF4444';
                          resultText = 'High Risk';
                        } else if (isMod) {
                          scoreBg = '#FEF3C7';
                          scoreColor = '#D97706';
                          resultBg = '#FEF3C7';
                          resultColor = '#D97706';
                          resultText = 'Moderate Risk';
                        }

                        return (
                          <tr
                            key={item.id}
                            style={{
                              borderBottom: '1px solid #F1F5F9',
                              transition: 'background-color 0.1s ease',
                            }}
                            className="dashboard-history-row"
                          >
                            <td style={{ padding: '0.875rem 1.25rem' }}>
                              <div style={{ fontWeight: 700, color: '#0F172A' }}>
                                {item.title || 'Untitled Job Posting'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '1px' }}>
                                {item.company_name || 'Unspecified Employer'}
                              </div>
                            </td>
                            <td style={{ padding: '0.875rem 1rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                              {new Date(item.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  backgroundColor: scoreBg,
                                  color: scoreColor,
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  minWidth: '28px',
                                }}
                              >
                                {item.overall_risk_score}
                              </span>
                            </td>
                            <td style={{ padding: '0.875rem 1rem', textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0.2rem 0.625rem',
                                  borderRadius: '9999px',
                                  backgroundColor: resultBg,
                                  color: resultColor,
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                }}
                              >
                                {resultText}
                              </span>
                            </td>
                            <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                              <Link
                                to={`/app/history/${item.id}`}
                                style={{
                                  color: '#2563EB',
                                  fontWeight: 600,
                                  textDecoration: 'none',
                                  fontSize: '0.8125rem',
                                }}
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748B' }}>
                          <Clock size={28} color="#CBD5E1" style={{ marginBottom: '0.5rem' }} />
                          <div>No previous analyses found.</div>
                          <Link
                            to="/app/analyze"
                            style={{
                              display: 'inline-block',
                              marginTop: '0.5rem',
                              color: '#2563EB',
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            Analyze your first job posting →
                          </Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Card: Quick Tips for Safe Job Search */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #EAECF0',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 1px 3px rgba(16, 24, 40, 0.04)',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <Lightbulb size={20} color="#EAB308" />
                  <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                    Quick Tips for Safe Job Search
                  </h2>
                </div>

                {/* 5 Guidance Bullets */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <CheckCircle2 size={17} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.4 }}>
                      Verify company website and official contact details.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <XCircle size={17} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.4 }}>
                      Be cautious of upfront payment requests.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <Mail size={17} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.4 }}>
                      Check if recruiter email matches company domain.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <Search size={17} color="#F59E0B" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.4 }}>
                      Look for realistic job descriptions and salary ranges.
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
                    <Users size={17} color="#8B5CF6" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '0.8125rem', color: '#334155', lineHeight: 1.4 }}>
                      Use AuthentiHire to analyze any suspicious postings.
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Blue CTA Banner */}
              <div
                style={{
                  backgroundColor: '#EFF6FF',
                  borderRadius: '10px',
                  border: '1px solid #DBEAFE',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.875rem',
                  marginTop: '1.5rem',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: '#2563EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Shield size={18} color="#FFFFFF" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.875rem', color: '#1E3A8A' }}>
                    When in doubt, analyze it with AuthentiHire!
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#2563EB', marginTop: '1px' }}>
                    Smarter Checks. Safer Choices.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
