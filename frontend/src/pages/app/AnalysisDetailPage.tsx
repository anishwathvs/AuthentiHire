import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Building,
  Calendar,
  Globe,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Loader2,
  FileWarning,
} from 'lucide-react';
import { fetchAnalysisById, AuthentiHireApiError } from '../../api/client';
import { RiskScoreRing } from '../../components/ui/RiskScoreRing';
import { ResultsDashboard } from '../../components/ResultsDashboard';
import { JobPostingRequest, JobAnalysisResponse } from '../../types/api';

export const AnalysisDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [analysis, setAnalysis] = useState<JobAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAnalysisById(id);
        setAnalysis(data);
      } catch (err: unknown) {
        if (err instanceof AuthentiHireApiError) {
          setError(err.message);
        } else {
          setError('Failed to load the historical analysis snapshot.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadAnalysis();
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Loader2 size={36} color="#1677FF" className="animate-spin" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div style={{ padding: '4rem 1.5rem', maxWidth: '640px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#FEF3F2',
            color: '#B42318',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <AlertTriangle size={24} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0B1F3A', marginBottom: '0.5rem' }}>
          Analysis Not Found
        </h2>
        <p style={{ fontSize: '0.9375rem', color: '#667085', marginBottom: '2rem' }}>
          {error || 'The requested analysis record does not exist or has been deleted.'}
        </p>
        <Link to="/app/history" className="btn-secondary">
          <ArrowLeft size={16} />
          <span>Return to History</span>
        </Link>
      </div>
    );
  }

  const reconstructedRequest: JobPostingRequest = {
    title: analysis.company.company_name || 'Stored Job Posting',
    company_name: analysis.company.company_name || undefined,
    url: analysis.company.website || undefined,
    recruiter_email: analysis.company.email || undefined,
    description: 'Immutable historical snapshot restored from AuthentiHire database records.',
  };

  return (
    <div style={{ padding: '2rem 1.5rem 4rem', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Top Navigation Back Link */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/app/history"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#667085',
            fontSize: '0.875rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Analysis History</span>
        </Link>
      </div>

      {/* Reusable Complete Results Report with Snapshot Banner */}
      <div
        style={{
          padding: '0.875rem 1.25rem',
          borderRadius: '10px',
          backgroundColor: '#F0F7FF',
          border: '1px solid #BAE0FF',
          color: '#1677FF',
          fontSize: '0.8125rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <ShieldCheck size={16} />
        <span>
          Viewing Immutable Stored Snapshot (Restored from database without re-running models)
        </span>
      </div>

      <ResultsDashboard
        data={analysis}
        originalRequest={reconstructedRequest}
        onNewAnalysis={() => navigate('/app/analyze')}
      />
    </div>
  );
};
