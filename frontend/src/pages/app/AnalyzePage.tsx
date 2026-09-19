import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Building,
  Mail,
  Globe,
  FileText,
  Loader2,
  ArrowRight,
  PlusCircle,
} from 'lucide-react';
import { analyzeJobPosting, AuthentiHireApiError } from '../../api/client';
import { JobPostingRequest, JobAnalysisResponse } from '../../types/api';
import { ResultsDashboard } from '../../components/ResultsDashboard';
import { LoadingState } from '../../components/LoadingState';

const SAMPLE_SCAM_POSTING: JobPostingRequest = {
  title: 'Remote Data Entry & Executive Assistant',
  company_name: 'Apex Global Logistics LLC',
  url: 'https://apex-globallogistics-jobs.net',
  recruiter_email: 'hr.recruiting@apex-globallogistics-jobs.net',
  telecommuting: true,
  description: `We are seeking an urgent Remote Data Entry Clerk and Administrative Assistant to join our fast-growing logistics team. 

Responsibilities:
- Process daily shipping logs and vendor invoices.
- Coordinate online client correspondence via Telegram messaging.
- Maintain spreadsheet accuracy with minimal supervision.

Compensation & Equipment:
- Starting pay: $48.50 per hour.
- A home-office setup allowance check of $3,500 will be mailed to you immediately upon hire to purchase your Apple MacBook Pro and secure software package from our accredited third-party supplier.

Interview Instructions:
All initial interviews are conducted immediately via Telegram. Please download the Telegram app and message our hiring coordinator @ApexLogisticsCareers with reference code #DATA-2026. Do not delay as slots fill fast!`,
};

export const AnalyzePage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [url, setUrl] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [description, setDescription] = useState('');
  const [telecommuting, setTelecommuting] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<JobAnalysisResponse | null>(null);
  const [lastRequest, setLastRequest] = useState<JobPostingRequest | null>(null);

  const handleClear = () => {
    setTitle('');
    setCompanyName('');
    setUrl('');
    setRecruiterEmail('');
    setDescription('');
    setTelecommuting(false);
    setApiError(null);
  };

  const handleLoadSample = () => {
    setTitle(SAMPLE_SCAM_POSTING.title || '');
    setCompanyName(SAMPLE_SCAM_POSTING.company_name || '');
    setUrl(SAMPLE_SCAM_POSTING.url || '');
    setRecruiterEmail(SAMPLE_SCAM_POSTING.recruiter_email || '');
    setDescription(SAMPLE_SCAM_POSTING.description);
    setTelecommuting(true);
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setApiError('Please provide the job description text.');
      return;
    }

    const requestPayload: JobPostingRequest = {
      title: title.trim() || undefined,
      company_name: companyName.trim() || undefined,
      url: url.trim() || undefined,
      recruiter_email: recruiterEmail.trim() || undefined,
      description: description.trim(),
      telecommuting: telecommuting,
    };

    setIsLoading(true);
    setApiError(null);
    setLastRequest(requestPayload);

    try {
      const response = await analyzeJobPosting(requestPayload, false);
      setAnalysisResult(response);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      if (err instanceof AuthentiHireApiError) {
        setApiError(err.message);
      } else {
        setApiError('An unexpected network error occurred while analyzing the posting. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (analysisResult && lastRequest) {
    return (
      <div style={{ padding: '2rem 1.5rem 4rem', maxWidth: '1240px', margin: '0 auto' }}>
        <ResultsDashboard
          data={analysisResult}
          originalRequest={lastRequest}
          onNewAnalysis={() => {
            setAnalysisResult(null);
            setLastRequest(null);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '2.5rem 2rem 4rem', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
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
          <Search size={14} color="#1677FF" />
          <span>Job Analysis Workspace</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.03em', margin: 0 }}>
          Analyze a job posting
        </h1>
        <p style={{ fontSize: '1rem', color: '#667085', marginTop: '0.375rem' }}>
          Paste the complete posting for a more useful multi-signal evidence assessment.
        </p>
      </div>

      {/* Main Workspace Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '2rem',
          alignItems: 'flex-start',
        }}
        className="analyze-grid"
      >
        {/* Left Column: Main Editor */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #EAECF0',
            boxShadow: '0 4px 12px -2px rgba(11, 31, 58, 0.04)',
            padding: '2rem',
          }}
        >
          {apiError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.875rem 1rem',
                borderRadius: '8px',
                backgroundColor: '#FEF3F2',
                border: '1px solid #FECDCA',
                color: '#B42318',
                fontSize: '0.875rem',
                marginBottom: '1.5rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Quick Actions Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleLoadSample}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.4375rem 0.875rem',
                  borderRadius: '6px',
                  backgroundColor: '#F0F7FF',
                  border: '1px solid #BAE0FF',
                  color: '#1677FF',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={14} />
                <span>Load Sample Scam Posting</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.4375rem 0.875rem',
                  borderRadius: '6px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #EAECF0',
                  color: '#667085',
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={13} />
                <span>Clear</span>
              </button>
            </div>

            {/* Description Textarea (Primary) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label className="form-label" htmlFor="job-description-input" style={{ margin: 0 }}>
                  Job Description / Posting Text <span style={{ color: '#F04438' }}>*</span>
                </label>
                <span style={{ fontSize: '0.75rem', color: description.length > 5000 ? '#F79009' : '#98A2B3' }}>
                  {description.length.toLocaleString()} characters
                </span>
              </div>
              <textarea
                id="job-description-input"
                className="form-input"
                rows={12}
                placeholder="Paste the complete job posting text, requirements, interview instructions, or compensation details here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                style={{
                  lineHeight: 1.6,
                  resize: 'vertical',
                  fontSize: '0.9375rem',
                }}
              />
            </div>

            {/* Supplementary Metadata Fields */}
            <div style={{ borderTop: '1px solid #F2F4F7', paddingTop: '1.25rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0B1F3A', marginBottom: '1rem' }}>
                Optional Company & Contact Details (Enhances Infrastructure Signals)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                <div>
                  <label className="form-label" htmlFor="job-title-input">
                    Job Title
                  </label>
                  <input
                    id="job-title-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Senior Software Engineer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="company-name-input">
                    Company Name
                  </label>
                  <input
                    id="company-name-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Acme Corp"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="company-url-input">
                    Company Website / URL
                  </label>
                  <input
                    id="company-url-input"
                    type="url"
                    className="form-input"
                    placeholder="https://company.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label" htmlFor="recruiter-email-input">
                    Recruiter Email Address
                  </label>
                  <input
                    id="recruiter-email-input"
                    type="email"
                    className="form-input"
                    placeholder="recruiting@company.com"
                    value={recruiterEmail}
                    onChange={(e) => setRecruiterEmail(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', color: '#475467' }}>
                  <input
                    type="checkbox"
                    checked={telecommuting}
                    onChange={(e) => setTelecommuting(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#1677FF' }}
                  />
                  <span>This is a remote / work-from-home position</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.875rem',
                borderRadius: '8px',
                fontSize: '1rem',
                boxShadow: '0 4px 12px rgba(22, 119, 255, 0.25)',
              }}
            >
              <Search size={18} />
              <span>Analyze Job Posting</span>
            </button>
          </form>
        </div>

        {/* Right Column: Analysis Checklist & Guide */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Live Analysis Checklist */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              border: '1px solid #EAECF0',
              padding: '1.5rem',
            }}
          >
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#0B1F3A', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Analysis Checklist
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: description.length >= 50 ? '#027A48' : '#667085' }}>
                <CheckCircle2 size={16} color={description.length >= 50 ? '#12B76A' : '#CBD5E1'} />
                <span>Posting text provided ({description.length >= 50 ? 'Ready' : 'Required'})</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: title.trim() ? '#027A48' : '#667085' }}>
                <CheckCircle2 size={16} color={title.trim() ? '#12B76A' : '#CBD5E1'} />
                <span>Job title specified</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: companyName.trim() ? '#027A48' : '#667085' }}>
                <CheckCircle2 size={16} color={companyName.trim() ? '#12B76A' : '#CBD5E1'} />
                <span>Company name entered</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: url.trim() ? '#027A48' : '#667085' }}>
                <CheckCircle2 size={16} color={url.trim() ? '#12B76A' : '#CBD5E1'} />
                <span>Website URL (enables DNS/SSL check)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: recruiterEmail.trim() ? '#027A48' : '#667085' }}>
                <CheckCircle2 size={16} color={recruiterEmail.trim() ? '#12B76A' : '#CBD5E1'} />
                <span>Recruiter email (enables MX match)</span>
              </div>
            </div>
          </div>

          {/* Privacy & Safe Screening Card */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '14px',
              border: '1px solid #EAECF0',
              padding: '1.25rem',
              fontSize: '0.8125rem',
              color: '#475467',
              lineHeight: 1.5,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontWeight: 700, color: '#0B1F3A', marginBottom: '0.375rem' }}>
              <ShieldCheck size={15} color="#1677FF" />
              <span>Safe Screening</span>
            </div>
            AuthentiHire processes job postings in memory and creates an immutable snapshot. We never contact the employer or alert them to the analysis.
          </div>
        </div>
      </div>
    </div>
  );
};
