import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Search,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardSummary, fetchAnalysisById, AuthentiHireApiError } from '../api/client';
import { DashboardSummaryResponse, AnalysisSummaryItem, JobAnalysisResponse } from '../types/api';

interface DashboardViewProps {
  onNavigateToAnalyze: () => void;
  onNavigateToHistory: () => void;
  onSelectAnalysis: (analysis: JobAnalysisResponse) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToAnalyze,
  onNavigateToHistory,
  onSelectAnalysis,
  onOpenAuth,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingAnalysisId, setLoadingAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardSummary();
      setSummary(data);
    } catch (err: unknown) {
      if (err instanceof AuthentiHireApiError) {
        if (err.status === 401) {
          setError('Your session has expired. Please log in again to view your dashboard.');
        } else {
          setError(err.message);
        }
      } else {
        setError('We couldn’t load your dashboard summary. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadSummary();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleOpenAnalysis = async (analysisId: string) => {
    setLoadingAnalysisId(analysisId);
    try {
      const fullAnalysis = await fetchAnalysisById(analysisId);
      onSelectAnalysis(fullAnalysis);
    } catch (err: unknown) {
      alert('Unable to load this analysis snapshot. It may have been deleted.');
    } finally {
      setLoadingAnalysisId(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatRelativeDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'Just now';
      if (diffHours === 1) return '1 hour ago';
      if (diffHours < 24) return `${diffHours} hours ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getRiskColorStyle = (score: number) => {
    if (score <= 30) return { bg: '#E6F4EA', text: '#137333', border: '#CEEAD6', label: 'LOW RISK' };
    if (score <= 60) return { bg: '#FEF7E0', text: '#B06000', border: '#FEEFC3', label: 'MODERATE RISK' };
    if (score <= 85) return { bg: '#FCE8E6', text: '#C5221F', border: '#FAD2CF', label: 'HIGH RISK' };
    return { bg: '#FBE4E4', text: '#A50E0E', border: '#F6B7B7', label: 'CRITICAL RISK' };
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', maxWidth: '640px', textAlign: 'center' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-default)',
          padding: '3rem 2rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-blue-light)',
            color: 'var(--color-primary-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-navy-dark)', marginBottom: '0.75rem' }}>
            Sign In to Access Your Dashboard
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Log in or create an account to view your verification history, monitor risk patterns, and save job posting analyses.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => onOpenAuth('login')}
              className="btn-primary"
              style={{ padding: '0.75rem 1.75rem' }}
            >
              Log in
            </button>
            <button
              onClick={() => onOpenAuth('signup')}
              className="btn-secondary"
              style={{ padding: '0.75rem 1.75rem' }}
            >
              Create account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const username = user?.email ? user.email.split('@')[0] : 'Member';

  return (
    <div style={{ backgroundColor: '#F7F8FA', minHeight: 'calc(100vh - 4.25rem)', padding: '2.5rem 0 4rem' }}>
      <div className="container">
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.25rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border-default)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-navy-dark)',
              marginBottom: '0.75rem',
            }}>
              <ShieldCheck size={14} color="var(--color-primary-blue)" />
              <span>Verified Account Dashboard</span>
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#0B1F3A',
              marginBottom: '0.375rem',
            }}>
              {getGreeting()}, {username}
            </h1>
            <p style={{ fontSize: '1rem', color: '#5F6368', margin: 0 }}>
              Your verification activity and risk insights at a glance.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.875rem' }}>
            <button
              onClick={onNavigateToAnalyze}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6875rem 1.25rem',
                boxShadow: '0 2px 8px rgba(22, 119, 255, 0.25)',
              }}
            >
              <PlusCircle size={17} />
              <span>Verify New Job</span>
            </button>
            <button
              onClick={loadSummary}
              aria-label="Refresh dashboard metrics"
              className="btn-secondary"
              style={{ padding: '0.6875rem 0.875rem' }}
              title="Refresh dashboard"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            backgroundColor: '#FCE8E6',
            border: '1px solid #FAD2CF',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle size={20} color="#C5221F" />
              <span style={{ fontSize: '0.9375rem', color: '#C5221F', fontWeight: 500 }}>{error}</span>
            </div>
            <button
              onClick={loadSummary}
              className="btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem', height: 'auto' }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && !summary && (
          <div>
            {/* Stat Cards Skeleton */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem',
            }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-default)',
                  padding: '1.5rem',
                  height: '110px',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }} />
              ))}
            </div>

            {/* Split Layout Skeleton */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}>
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-default)',
                padding: '1.75rem',
                height: '320px',
                animation: 'pulse 1.5s infinite ease-in-out',
              }} />
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border-default)',
                padding: '1.75rem',
                height: '320px',
                animation: 'pulse 1.5s infinite ease-in-out',
              }} />
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!isLoading && summary && (
          <>
            {summary.total_analyses === 0 ? (
              /* Empty State for New Accounts (Task 15) */
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-default)',
                padding: '4rem 2rem',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
                marginTop: '1rem',
              }}>
                <div style={{
                  width: '4rem',
                  height: '4rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary-blue-light)',
                  color: 'var(--color-primary-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}>
                  <FileText size={32} />
                </div>
                <h3 style={{ fontSize: '1.375rem', fontWeight: 700, color: '#0B1F3A', marginBottom: '0.75rem' }}>
                  No analyses yet
                </h3>
                <p style={{
                  color: '#5F6368',
                  fontSize: '0.9375rem',
                  maxWidth: '460px',
                  margin: '0 auto 2rem',
                  lineHeight: 1.6,
                }}>
                  Paste a job or internship posting and let AuthentiHire check the signals before you apply.
                </p>
                <button
                  onClick={onNavigateToAnalyze}
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.75rem',
                    fontSize: '0.9375rem',
                  }}
                >
                  <span>Analyze a job</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              /* Active Dashboard Content */
              <div>
                {/* Metric Summary Cards (Task 5) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '2rem',
                }}>
                  {/* Total Analyses */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-default)',
                    padding: '1.25rem 1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#5F6368', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Total Analyses
                      </span>
                      <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-primary-blue-light)', color: 'var(--color-primary-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={16} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em' }}>
                      {summary.total_analyses}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#5F6368', marginTop: '0.25rem' }}>
                      {summary.recent_analysis_count} in last 7 days
                    </div>
                  </div>

                  {/* High Risk Count */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-default)',
                    padding: '1.25rem 1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#5F6368', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        High & Critical Risk
                      </span>
                      <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#FCE8E6', color: '#C5221F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AlertTriangle size={16} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#C5221F', letterSpacing: '-0.02em' }}>
                      {summary.risk_distribution.high + summary.risk_distribution.critical}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#5F6368', marginTop: '0.25rem' }}>
                      {summary.risk_distribution.critical > 0 ? `${summary.risk_distribution.critical} critical severity` : 'Flagged for review'}
                    </div>
                  </div>

                  {/* Low Risk Count */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-default)',
                    padding: '1.25rem 1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#5F6368', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Low Risk (Clean)
                      </span>
                      <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#E6F4EA', color: '#137333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircle2 size={16} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 800, color: '#137333', letterSpacing: '-0.02em' }}>
                      {summary.risk_distribution.low}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#5F6368', marginTop: '0.25rem' }}>
                      {summary.total_analyses > 0 ? `${Math.round((summary.risk_distribution.low / summary.total_analyses) * 100)}% of your verified jobs` : '0%'}
                    </div>
                  </div>

                  {/* Average Risk Score */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-default)',
                    padding: '1.25rem 1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#5F6368', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Avg Risk Score
                      </span>
                      <div style={{ width: '2rem', height: '2rem', borderRadius: 'var(--radius-sm)', backgroundColor: '#F1F3F4', color: '#3C4043', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={16} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                      <span style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.02em' }}>
                        {summary.average_risk_score}
                      </span>
                      <span style={{ fontSize: '0.9375rem', color: '#5F6368', fontWeight: 500 }}>/ 100</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: '#5F6368', marginTop: '0.25rem' }}>
                      {summary.average_risk_score <= 30 ? 'Low average risk' : (summary.average_risk_score <= 60 ? 'Moderate average' : 'High average risk')}
                    </div>
                  </div>
                </div>

                {/* Two-Column Analytics Layout */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.25fr)',
                  gap: '1.5rem',
                }} className="dashboard-grid">
                  {/* Left Column: Risk Distribution Breakdown (Task 13) */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-default)',
                    padding: '1.75rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
                          Risk Distribution
                        </h2>
                        <span style={{ fontSize: '0.8125rem', color: '#5F6368' }}>
                          {summary.total_analyses} analyses
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#5F6368', marginBottom: '1.5rem' }}>
                        Aggregate risk tier categorization across all your evaluated postings.
                      </p>

                      {/* Accessible Horizontal Bars */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
                        {/* Low Risk */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                            <span style={{ color: '#137333' }}>Low Risk (0–30)</span>
                            <span style={{ color: '#111318' }}>{summary.risk_distribution.low}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F3F4', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: summary.total_analyses > 0 ? `${(summary.risk_distribution.low / summary.total_analyses) * 100}%` : '0%',
                                height: '100%',
                                backgroundColor: '#137333',
                                borderRadius: '4px',
                                transition: 'width 0.5s ease',
                              }}
                              aria-label={`Low risk: ${summary.risk_distribution.low} analyses`}
                            />
                          </div>
                        </div>

                        {/* Moderate Risk */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                            <span style={{ color: '#B06000' }}>Moderate Risk (31–60)</span>
                            <span style={{ color: '#111318' }}>{summary.risk_distribution.moderate}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F3F4', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: summary.total_analyses > 0 ? `${(summary.risk_distribution.moderate / summary.total_analyses) * 100}%` : '0%',
                                height: '100%',
                                backgroundColor: '#B06000',
                                borderRadius: '4px',
                                transition: 'width 0.5s ease',
                              }}
                              aria-label={`Moderate risk: ${summary.risk_distribution.moderate} analyses`}
                            />
                          </div>
                        </div>

                        {/* High Risk */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                            <span style={{ color: '#C5221F' }}>High Risk (61–85)</span>
                            <span style={{ color: '#111318' }}>{summary.risk_distribution.high}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F3F4', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: summary.total_analyses > 0 ? `${(summary.risk_distribution.high / summary.total_analyses) * 100}%` : '0%',
                                height: '100%',
                                backgroundColor: '#C5221F',
                                borderRadius: '4px',
                                transition: 'width 0.5s ease',
                              }}
                              aria-label={`High risk: ${summary.risk_distribution.high} analyses`}
                            />
                          </div>
                        </div>

                        {/* Critical Risk */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>
                            <span style={{ color: '#A50E0E' }}>Critical Risk (86–100)</span>
                            <span style={{ color: '#111318' }}>{summary.risk_distribution.critical}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F3F4', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: summary.total_analyses > 0 ? `${(summary.risk_distribution.critical / summary.total_analyses) * 100}%` : '0%',
                                height: '100%',
                                backgroundColor: '#A50E0E',
                                borderRadius: '4px',
                                transition: 'width 0.5s ease',
                              }}
                              aria-label={`Critical risk: ${summary.risk_distribution.critical} analyses`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      backgroundColor: '#F8F9FA',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.875rem 1rem',
                      marginTop: '1.5rem',
                      fontSize: '0.8125rem',
                      color: '#5F6368',
                      lineHeight: 1.5,
                      border: '1px solid #E8EAED',
                    }}>
                      Scores are computed objectively using our multi-signal risk engine combining calibrated ML, scam patterns, and domain verification.
                    </div>
                  </div>

                  {/* Right Column: Recent Analyses (Task 14) */}
                  <div style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-default)',
                    padding: '1.75rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <div>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
                          Recent Analyses
                        </h2>
                        <span style={{ fontSize: '0.8125rem', color: '#5F6368' }}>
                          Latest job evaluations
                        </span>
                      </div>
                      <button
                        onClick={onNavigateToHistory}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--color-primary-blue)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0.25rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <span>View all</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    {summary.recent_analyses.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#5F6368', fontSize: '0.875rem' }}>
                        No recent activity recorded.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                        {summary.recent_analyses.map((item) => {
                          const riskStyle = getRiskColorStyle(item.overall_risk_score);
                          const isOpening = loadingAnalysisId === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleOpenAnalysis(item.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.875rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid #ECEFF1',
                                backgroundColor: '#FAFAFB',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#FFFFFF';
                                e.currentTarget.style.borderColor = 'var(--color-primary-blue)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.04)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#FAFAFB';
                                e.currentTarget.style.borderColor = '#ECEFF1';
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleOpenAnalysis(item.id);
                                }
                              }}
                              aria-label={`Open analysis for ${item.title || 'Job Posting'}`}
                            >
                              <div style={{ minWidth: 0, flex: 1, paddingRight: '1rem' }}>
                                <div style={{
                                  fontSize: '0.9375rem',
                                  fontWeight: 600,
                                  color: '#0B1F3A',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}>
                                  {item.title || 'Untitled Job Posting'}
                                </div>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.75rem',
                                  fontSize: '0.8125rem',
                                  color: '#5F6368',
                                  marginTop: '0.25rem',
                                }}>
                                  <span>{item.company_name || 'Direct Employer'}</span>
                                  <span>•</span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={12} />
                                    {formatRelativeDate(item.created_at)}
                                  </span>
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                  padding: '0.25rem 0.625rem',
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: riskStyle.bg,
                                  border: `1px solid ${riskStyle.border}`,
                                  color: riskStyle.text,
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.375rem',
                                  whiteSpace: 'nowrap',
                                }}>
                                  <span>Score: {item.overall_risk_score}</span>
                                </div>
                                <div style={{ color: '#9AA0A6' }}>
                                  {isOpening ? (
                                    <RefreshCw size={16} className="animate-spin" />
                                  ) : (
                                    <ExternalLink size={15} />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 840px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
