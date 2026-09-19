import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  Trash2,
  ArrowRight,
  Loader2,
  Calendar,
  Building,
  AlertCircle,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { fetchAnalysesHistory, deleteAnalysis } from '../../api/client';
import { AnalysisSummaryItem, PaginatedAnalysisHistory } from '../../types/api';
import { RiskScoreRing } from '../../components/ui/RiskScoreRing';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<AnalysisSummaryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [riskBand, setRiskBand] = useState<string>('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = (page - 1) * limit;
      const res: PaginatedAnalysisHistory = await fetchAnalysesHistory({
        offset,
        limit,
        search: search.trim() || undefined,
        risk_band: riskBand || undefined,
        sort: sortBy,
        order: sortOrder,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err: unknown) {
      setError('Failed to load analysis history. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [page, limit, riskBand, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadHistory();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await deleteAnalysis(deleteTargetId);
      setDeleteTargetId(null);
      loadHistory();
    } catch {
      setError('Failed to delete analysis snapshot.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div style={{ padding: '2.5rem 2rem 4rem', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #EAECF0',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: '#0B1F3A',
              marginBottom: '0.75rem',
            }}
          >
            <History size={14} color="#1677FF" />
            <span>Analysis Archive</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.03em', margin: 0 }}>
            Analysis History
          </h1>
          <p style={{ fontSize: '1rem', color: '#667085', marginTop: '0.375rem' }}>
            Review, search, and inspect saved immutable job risk snapshots.
          </p>
        </div>

        <Link
          to="/app/analyze"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6875rem 1.25rem',
            borderRadius: '8px',
            backgroundColor: '#1677FF',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '0.875rem',
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(22, 119, 255, 0.25)',
          }}
        >
          <PlusCircle size={16} />
          <span>New Analysis</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #EAECF0',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: '1 0 280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search by job title or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
            <Search
              size={16}
              color="#94A3B8"
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
          <button type="submit" className="btn-secondary" style={{ padding: '0.625rem 1rem' }}>
            Search
          </button>
        </form>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Risk Band Filter */}
          <select
            value={riskBand}
            onChange={(e) => {
              setRiskBand(e.target.value);
              setPage(1);
            }}
            className="form-input"
            style={{ width: 'auto', padding: '0.5rem 0.875rem' }}
          >
            <option value="">All Risk Bands</option>
            <option value="LOW">Low Risk</option>
            <option value="MODERATE">Moderate Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Risk</option>
          </select>

          {/* Sort Filter */}
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [f, o] = e.target.value.split(':');
              setSortBy(f);
              setSortOrder(o as 'asc' | 'desc');
              setPage(1);
            }}
            className="form-input"
            style={{ width: 'auto', padding: '0.5rem 0.875rem' }}
          >
            <option value="created_at:desc">Newest First</option>
            <option value="created_at:asc">Oldest First</option>
            <option value="overall_risk_score:desc">Highest Risk First</option>
            <option value="overall_risk_score:asc">Lowest Risk First</option>
          </select>
        </div>
      </div>

      {/* History Table / List */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: '1px solid #EAECF0', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem 0' }}>
            <Loader2 size={32} color="#1677FF" className="animate-spin" />
          </div>
        ) : items.length > 0 ? (
          <div>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1.25rem 1.5rem',
                  borderBottom: '1px solid #F2F4F7',
                  gap: '1rem',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {/* Clickable Info Area */}
                <Link
                  to={`/app/history/${item.id}`}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1.25rem',
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '10px',
                      backgroundColor:
                        item.risk_band?.toUpperCase().includes('LOW')
                          ? '#ECFDF3'
                          : item.risk_band?.toUpperCase().includes('MOD')
                          ? '#FFFAEB'
                          : '#FEF3F2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1rem',
                      color:
                        item.risk_band?.toUpperCase().includes('LOW')
                          ? '#027A48'
                          : item.risk_band?.toUpperCase().includes('MOD')
                          ? '#B54708'
                          : '#B42318',
                      flexShrink: 0,
                    }}
                  >
                    {item.overall_risk_score}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0B1F3A', margin: 0 }}>
                      {item.title || 'Untitled Job Posting'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', fontSize: '0.8125rem', color: '#667085', marginTop: '4px' }}>
                      <span>{item.company_name || 'Unspecified Employer'}</span>
                      <span>•</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={13} />
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Right Side Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                  <span
                    style={{
                      padding: '0.25rem 0.625rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor:
                        item.risk_band?.toUpperCase().includes('LOW')
                          ? '#ECFDF3'
                          : item.risk_band?.toUpperCase().includes('MOD')
                          ? '#FFFAEB'
                          : '#FEF3F2',
                      color:
                        item.risk_band?.toUpperCase().includes('LOW')
                          ? '#027A48'
                          : item.risk_band?.toUpperCase().includes('MOD')
                          ? '#B54708'
                          : '#B42318',
                    }}
                  >
                    {item.risk_band?.toUpperCase().includes('RISK') ? item.risk_band : `${item.risk_band} RISK`}
                  </span>

                  <button
                    onClick={() => setDeleteTargetId(item.id)}
                    style={{
                      padding: '0.375rem',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#94A3B8',
                      cursor: 'pointer',
                    }}
                    title="Delete snapshot"
                    aria-label="Delete snapshot"
                  >
                    <Trash2 size={16} />
                  </button>

                  <Link
                    to={`/app/history/${item.id}`}
                    style={{
                      display: 'inline-flex',
                      padding: '0.375rem',
                      color: '#1677FF',
                      textDecoration: 'none',
                    }}
                    title="View report"
                  >
                    <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            <div
              style={{
                padding: '1rem 1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#FAFAFA',
                fontSize: '0.875rem',
                color: '#667085',
              }}
            >
              <div>
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} results
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn-secondary"
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary"
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center', color: '#667085' }}>
            <Clock size={36} color="#CBD5E1" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0B1F3A', marginBottom: '0.375rem' }}>
              No analyses found
            </h3>
            <p style={{ fontSize: '0.875rem', margin: 0 }}>
              {search || riskBand ? 'Try adjusting your search query or filters.' : 'Run a job analysis to start tracking history.'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 31, 58, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0B1F3A', marginBottom: '0.5rem' }}>
              Delete analysis snapshot?
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#667085', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              This will permanently remove this analysis record from your history. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                style={{
                  padding: '0.625rem 1.25rem',
                  borderRadius: '9999px',
                  backgroundColor: '#F04438',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete snapshot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
