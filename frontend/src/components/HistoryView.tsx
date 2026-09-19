import React, { useState, useEffect, useCallback } from 'react';
import {
  History as HistoryIcon,
  Search,
  Filter,
  ArrowUpDown,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  X,
  Building,
  MapPin,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchAnalysesHistory, fetchAnalysisById, deleteAnalysis, AuthentiHireApiError } from '../api/client';
import { PaginatedAnalysisHistory, AnalysisSummaryItem, JobAnalysisResponse, HistoryQueryParams } from '../types/api';

interface HistoryViewProps {
  onNavigateToAnalyze: () => void;
  onSelectAnalysis: (analysis: JobAnalysisResponse) => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onNavigateToAnalyze,
  onSelectAnalysis,
  onOpenAuth,
}) => {
  const { isAuthenticated } = useAuth();

  // Query state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRiskBand, setSelectedRiskBand] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Data state
  const [historyData, setHistoryData] = useState<PaginatedAnalysisHistory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingAnalysisId, setLoadingAnalysisId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Delete modal state (Task 16)
  const [itemToDelete, setItemToDelete] = useState<AnalysisSummaryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * pageSize;
      const params: HistoryQueryParams = {
        limit: pageSize,
        offset: offset,
        search: searchQuery.trim() || undefined,
        risk_band: selectedRiskBand === 'ALL' ? undefined : selectedRiskBand,
        sort: sortBy,
        order: sortOrder,
      };

      const data = await fetchAnalysesHistory(params);
      setHistoryData(data);
    } catch (err: unknown) {
      if (err instanceof AuthentiHireApiError) {
        if (err.status === 401) {
          setError('Your session has expired. Please log in again to view your history.');
        } else {
          setError(err.message);
        }
      } else {
        setError('We couldn’t load your analysis history. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, selectedRiskBand, sortBy, sortOrder]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAnalysis(itemToDelete.id);
      setItemToDelete(null);
      // Reload current page or step back if last item on page
      if (historyData && historyData.items.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      } else {
        await loadHistory();
      }
    } catch (err: unknown) {
      alert('Failed to delete analysis. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = historyData ? Math.ceil(historyData.total / pageSize) : 1;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
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

  return (
    <div style={{ backgroundColor: '#F7F8FA', minHeight: 'calc(100vh - 4.25rem)', padding: '2.5rem 0 4rem' }}>
      <div className="container">
        {/* Page Header */}
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
              <HistoryIcon size={14} color="var(--color-primary-blue)" />
              <span>Analysis Audit Log</span>
            </div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: '#0B1F3A',
              marginBottom: '0.375rem',
            }}>
              Analysis History
            </h1>
            <p style={{ fontSize: '1rem', color: '#5F6368', margin: 0 }}>
              Search, filter, and inspect previous job verification snapshots.
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
              onClick={loadHistory}
              aria-label="Refresh analysis history"
              className="btn-secondary"
              style={{ padding: '0.6875rem 0.875rem' }}
              title="Refresh list"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar (Task 8 & Task 10) */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border-default)',
          padding: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>
          {/* Top row: Search input & Sort select */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            {/* Search Input */}
            <div style={{
              position: 'relative',
              flex: '1 1 280px',
              maxWidth: '480px',
            }}>
              <Search
                size={16}
                color="#5F6368"
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                placeholder="Search by job title, company, or domain..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem 0.625rem 2.5rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-default)',
                  backgroundColor: '#FAFAFB',
                  color: 'var(--color-navy-dark)',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#5F6368',
                    padding: 0,
                  }}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ArrowUpDown size={15} color="#5F6368" />
              <label htmlFor="history-sort-select" style={{ fontSize: '0.8125rem', color: '#5F6368', fontWeight: 600 }}>Sort:</label>
              <select
                id="history-sort-select"
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split(':');
                  setSortBy(field);
                  setSortOrder(dir as 'asc' | 'desc');
                  setCurrentPage(1);
                }}
                style={{
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border-default)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-navy-dark)',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <option value="created_at:desc">Newest First</option>
                <option value="created_at:asc">Oldest First</option>
                <option value="overall_risk_score:desc">Highest Risk Score</option>
                <option value="overall_risk_score:asc">Lowest Risk Score</option>
                <option value="title:asc">Job Title (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Bottom row: Risk Band Filter Chips (Task 10) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            paddingTop: '0.5rem',
            borderTop: '1px solid #F1F3F4',
          }}>
            <span style={{ fontSize: '0.8125rem', color: '#5F6368', fontWeight: 600, marginRight: '0.25rem' }}>
              Risk Tier:
            </span>
            {[
              { key: 'ALL', label: 'All Tiers' },
              { key: 'LOW', label: 'Low Risk' },
              { key: 'MODERATE', label: 'Moderate Risk' },
              { key: 'HIGH', label: 'High Risk' },
              { key: 'CRITICAL', label: 'Critical Risk' },
            ].map((chip) => {
              const isSelected = selectedRiskBand === chip.key;
              return (
                <button
                  key={chip.key}
                  onClick={() => {
                    setSelectedRiskBand(chip.key);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '0.3125rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? 600 : 500,
                    border: isSelected ? '1px solid var(--color-primary-blue)' : '1px solid var(--color-border-default)',
                    backgroundColor: isSelected ? 'var(--color-primary-blue-light)' : '#FFFFFF',
                    color: isSelected ? 'var(--color-primary-blue)' : '#5F6368',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: '#FCE8E6',
            border: '1px solid #FAD2CF',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={20} color="#C5221F" />
              <span style={{ fontSize: '0.9375rem', color: '#C5221F', fontWeight: 500 }}>{error}</span>
            </div>
            <button
              onClick={loadHistory}
              className="btn-secondary"
              style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem', height: 'auto' }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && !historyData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-default)',
                  height: '80px',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />
            ))}
          </div>
        )}

        {/* History List or Empty States */}
        {!isLoading && historyData && (
          <>
            {historyData.items.length === 0 ? (
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-default)',
                padding: '4rem 2rem',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '50%',
                  backgroundColor: '#F1F3F4',
                  color: '#5F6368',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}>
                  <Search size={26} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0B1F3A', marginBottom: '0.5rem' }}>
                  {searchQuery || selectedRiskBand !== 'ALL' ? 'No matching analyses found' : 'No analyses in history'}
                </h3>
                <p style={{ color: '#5F6368', fontSize: '0.9375rem', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                  {searchQuery || selectedRiskBand !== 'ALL'
                    ? 'Try adjusting your search terms or clearing your risk tier filters.'
                    : 'Analyze a job posting to see it documented here in your permanent audit history.'}
                </p>
                {searchQuery || selectedRiskBand !== 'ALL' ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedRiskBand('ALL');
                      setCurrentPage(1);
                    }}
                    className="btn-secondary"
                  >
                    Reset Filters
                  </button>
                ) : (
                  <button
                    onClick={onNavigateToAnalyze}
                    className="btn-primary"
                  >
                    Analyze a Job Posting
                  </button>
                )}
              </div>
            ) : (
              /* Analysis Items Table / Card Feed */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {historyData.items.map((item) => {
                  const riskStyle = getRiskColorStyle(item.overall_risk_score);
                  const isOpening = loadingAnalysisId === item.id;

                  return (
                    <div
                      key={item.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border-default)',
                        padding: '1.125rem 1.5rem',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1.25rem',
                        flexWrap: 'wrap',
                        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                      }}
                      className="history-row"
                    >
                      {/* Left: Job & Company Details */}
                      <div style={{ flex: '1 1 300px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h2 style={{
                            fontSize: '1.0625rem',
                            fontWeight: 700,
                            color: '#0B1F3A',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {item.title || 'Untitled Job Posting'}
                          </h2>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          flexWrap: 'wrap',
                          fontSize: '0.8125rem',
                          color: '#5F6368',
                        }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                            <Building size={13} />
                            <strong>{item.company_name || 'Direct Employer'}</strong>
                          </span>
                          {item.location && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <MapPin size={13} />
                              {item.location}
                            </span>
                          )}
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={13} />
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Assessment Metrics Snapshot */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        flexWrap: 'wrap',
                      }}>
                        {/* Company Trust Score */}
                        <div style={{ textAlign: 'center', minWidth: '70px' }}>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#5F6368', textTransform: 'uppercase' }}>
                            Trust Score
                          </div>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: item.company_trust_score >= 60 ? '#137333' : '#B06000' }}>
                            {item.company_trust_score}/100
                          </div>
                        </div>

                        {/* ML Fraud Probability */}
                        <div style={{ textAlign: 'center', minWidth: '70px' }}>
                          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#5F6368', textTransform: 'uppercase' }}>
                            ML Fraud
                          </div>
                          <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: item.fraud_probability > 0.4 ? '#C5221F' : '#3C4043' }}>
                            {(item.fraud_probability * 100).toFixed(1)}%
                          </div>
                        </div>

                        {/* Unified Risk Score Badge */}
                        <div style={{
                          padding: '0.375rem 0.875rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: riskStyle.bg,
                          border: `1px solid ${riskStyle.border}`,
                          color: riskStyle.text,
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          minWidth: '130px',
                          justifyContent: 'center',
                        }}>
                          <span>Score: {item.overall_risk_score}</span>
                          <span>•</span>
                          <span style={{ fontSize: '0.75rem' }}>{item.risk_band}</span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <button
                          onClick={() => handleOpenAnalysis(item.id)}
                          className="btn-secondary"
                          style={{
                            padding: '0.5rem 0.875rem',
                            fontSize: '0.8125rem',
                            gap: '0.375rem',
                          }}
                          disabled={isOpening}
                          title="Open analysis snapshot"
                        >
                          {isOpening ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <ExternalLink size={14} />
                          )}
                          <span>View Report</span>
                        </button>

                        <button
                          onClick={() => setItemToDelete(item)}
                          style={{
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border-default)',
                            backgroundColor: '#FFFFFF',
                            color: '#5F6368',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#FAD2CF';
                            e.currentTarget.style.color = '#C5221F';
                            e.currentTarget.style.backgroundColor = '#FCE8E6';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-border-default)';
                            e.currentTarget.style.color = '#5F6368';
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                          }}
                          title="Delete this analysis"
                          aria-label={`Delete analysis for ${item.title || 'Job Posting'}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls (Task 17) */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#FFFFFF',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-default)',
                    padding: '0.875rem 1.25rem',
                    marginTop: '0.75rem',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}>
                    <span style={{ fontSize: '0.875rem', color: '#5F6368' }}>
                      Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, historyData.total)} of {historyData.total} analyses
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border-default)',
                          backgroundColor: currentPage === 1 ? '#F1F3F4' : '#FFFFFF',
                          color: currentPage === 1 ? '#9AA0A6' : 'var(--color-navy-dark)',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                        }}
                        aria-label="Previous Page"
                      >
                        <ChevronLeft size={14} />
                        <span>Previous</span>
                      </button>

                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-navy-dark)', padding: '0 0.5rem' }}>
                        Page {currentPage} of {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border-default)',
                          backgroundColor: currentPage === totalPages ? '#F1F3F4' : '#FFFFFF',
                          color: currentPage === totalPages ? '#9AA0A6' : 'var(--color-navy-dark)',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                        }}
                        aria-label="Next Page"
                      >
                        <span>Next</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal (Task 16) */}
      {itemToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(11, 31, 58, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border-default)',
            boxShadow: 'var(--shadow-lg)',
            maxWidth: '440px',
            width: '100%',
            padding: '2rem',
            animation: 'fadeIn 0.15s ease-out',
          }}>
            <div style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '50%',
              backgroundColor: '#FCE8E6',
              color: '#C5221F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}>
              <Trash2 size={24} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0B1F3A', marginBottom: '0.5rem' }}>
              Delete this analysis?
            </h3>
            <p style={{ fontSize: '0.9375rem', color: '#5F6368', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              This removes the saved analysis for <strong>{itemToDelete.title || 'Untitled Job'}</strong> and its associated verification evidence from your audit log.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setItemToDelete(null)}
                className="btn-secondary"
                disabled={isDeleting}
                style={{ padding: '0.625rem 1.25rem' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#C5221F',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {isDeleting ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .history-row:hover {
          border-color: #B3D7FF !important;
          box-shadow: 0 4px 12px rgba(11, 31, 58, 0.05) !important;
        }
      `}</style>
    </div>
  );
};
