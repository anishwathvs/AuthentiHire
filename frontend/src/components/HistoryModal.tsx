import React, { useState, useEffect } from 'react';
import { X, History, Trash2, ExternalLink, ShieldAlert, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { AnalysisSummaryItem, JobAnalysisResponse } from '../types/api';
import { fetchAnalysesHistory, deleteAnalysis, fetchAnalysisById } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnalysis: (analysis: JobAnalysisResponse) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectAnalysis,
}) => {
  const [items, setItems] = useState<AnalysisSummaryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { isAuthenticated, user } = useAuth();

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAnalysesHistory(50, 0);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError('Unable to load analysis history. Please check backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this analysis record?')) return;

    setDeletingId(id);
    try {
      await deleteAnalysis(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch {
      alert('Failed to delete analysis record.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelect = async (id: string) => {
    setLoadingId(id);
    try {
      const fullAnalysis = await fetchAnalysisById(id);
      onSelectAnalysis(fullAnalysis);
      onClose();
    } catch {
      alert('Unable to load complete analysis details.');
    } finally {
      setLoadingId(null);
    }
  };

  const getRiskBadge = (score: number, band: string) => {
    if (score < 25) {
      return { bg: 'var(--color-success-light)', color: 'var(--color-success-dark)', text: `${score}/100 LOW RISK` };
    }
    if (score < 50) {
      return { bg: 'var(--color-warning-light)', color: 'var(--color-warning-dark)', text: `${score}/100 MODERATE` };
    }
    return { bg: 'var(--color-danger-light)', color: 'var(--color-danger-dark)', text: `${score}/100 HIGH RISK` };
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-2xl)',
          border: '1px solid var(--color-border-default)',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--color-border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--color-bg-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div
              style={{
                width: '2rem',
                height: '2rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-blue-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-primary-blue)',
              }}
            >
              <History size={18} />
            </div>
            <div>
              <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-navy-dark)', fontSize: '1.125rem' }}>
                {isAuthenticated ? 'My Analysis History' : 'Recent Analyses'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
                ({total} saved)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={loadHistory}
              disabled={isLoading}
              style={{
                padding: '0.375rem',
                borderRadius: 'var(--radius-full)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
              title="Refresh"
            >
              <RefreshCw size={17} className={isLoading ? 'spin-icon' : ''} />
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '0.375rem',
                borderRadius: 'var(--radius-full)',
                color: 'var(--color-text-secondary)',
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content / List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.75rem' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.875rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger-dark)',
                fontSize: '0.875rem',
                marginBottom: '1rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {isLoading && items.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <div style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
                <RefreshCw size={24} className="spin-icon" color="var(--color-primary-blue)" />
              </div>
              <p style={{ fontSize: '0.9375rem' }}>Loading analysis history...</p>
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <ShieldCheck size={36} color="var(--color-border-default)" style={{ marginBottom: '0.75rem' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-dark)', marginBottom: '0.375rem' }}>
                No saved analyses yet
              </h3>
              <p style={{ fontSize: '0.875rem', maxWidth: '320px', margin: '0 auto' }}>
                {isAuthenticated
                  ? 'Analyses you run while logged in will automatically appear here.'
                  : 'Log in to securely persist and sync your fraud assessments across sessions.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {items.map((item) => {
                const badge = getRiskBadge(item.overall_risk_score, item.risk_band);
                const isSelected = loadingId === item.id;
                const isBeingDeleted = deletingId === item.id;

                const dateStr = new Date(item.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.125rem',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--color-border-default)',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                      opacity: isBeingDeleted ? 0.4 : 1,
                    }}
                    className="history-card-hover"
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 'var(--font-weight-bold)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {badge.text}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                          {dateStr}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.9375rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title || 'Untitled Job Posting'}
                      </div>

                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
                        {item.company_name ? item.company_name : 'Unspecified Employer'}
                        {item.location ? ` • ${item.location}` : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(item.id);
                        }}
                        disabled={isSelected}
                        className="btn-secondary"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        {isSelected ? 'Loading...' : 'View'}
                        <ExternalLink size={13} style={{ marginLeft: '4px' }} />
                      </button>

                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        disabled={isBeingDeleted}
                        style={{
                          padding: '0.375rem',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--color-text-tertiary)',
                          cursor: 'pointer',
                          transition: 'color var(--transition-fast)',
                        }}
                        title="Delete record"
                        aria-label="Delete analysis"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`
        .history-card-hover:hover {
          border-color: var(--color-primary-blue) !important;
          box-shadow: var(--shadow-sm);
        }
      `}</style>
    </div>
  );
};
