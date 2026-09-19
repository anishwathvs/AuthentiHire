import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, RotateCcw, AlertCircle, Sparkles } from 'lucide-react';
import { JobPostingRequest } from '../types/api';

interface AnalysisFormProps {
  onBack: () => void;
  onSubmit: (data: JobPostingRequest) => void;
  isLoading: boolean;
  error?: string | null;
}

export const AnalysisForm: React.FC<AnalysisFormProps> = ({
  onBack,
  onSubmit,
  isLoading,
  error,
}) => {
  const [description, setDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [department, setDepartment] = useState('');
  const [companyProfile, setCompanyProfile] = useState('');
  const [requirements, setRequirements] = useState('');
  const [benefits, setBenefits] = useState('');
  const [telecommuting, setTelecommuting] = useState(false);
  const [hasCompanyLogo, setHasCompanyLogo] = useState(false);
  const [hasQuestions, setHasQuestions] = useState(false);

  const [isOptionalExpanded, setIsOptionalExpanded] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleClear = () => {
    setDescription('');
    setCompanyName('');
    setRecruiterEmail('');
    setWebsiteUrl('');
    setLocation('');
    setEmploymentType('');
    setSalaryRange('');
    setDepartment('');
    setCompanyProfile('');
    setRequirements('');
    setBenefits('');
    setTelecommuting(false);
    setHasCompanyLogo(false);
    setHasQuestions(false);
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setValidationError('Please paste the job description or posting text before analyzing.');
      return;
    }

    setValidationError(null);
    onSubmit({
      description: description.trim(),
      company_name: companyName.trim() || undefined,
      recruiter_email: recruiterEmail.trim() || undefined,
      url: websiteUrl.trim() || undefined,
      location: location.trim() || undefined,
      employment_type: employmentType || undefined,
      salary_range: salaryRange.trim() || undefined,
      department: department.trim() || undefined,
      company_profile: companyProfile.trim() || undefined,
      requirements: requirements.trim() || undefined,
      benefits: benefits.trim() || undefined,
      telecommuting,
      has_company_logo: hasCompanyLogo,
      has_questions: hasQuestions,
    });
  };

  const handleLoadSampleScam = () => {
    setDescription(
      'Urgent opening for Immediate Data Entry Clerk! Earn $45/hour working from home. No prior experience required. Please pay a registration fee of $80 via Western Union before onboarding begins. Contact our recruitment team at fastjobs@gmail.com for instant interview scheduling.'
    );
    setCompanyName('Global Logistics Solutions');
    setRecruiterEmail('fastjobs@gmail.com');
    setTelecommuting(true);
    setHasCompanyLogo(false);
    setHasQuestions(false);
    setSalaryRange('$45/hr');
    setIsOptionalExpanded(true);
    setValidationError(null);
  };

  return (
    <section style={{
      paddingTop: '2.5rem',
      paddingBottom: '5rem',
    }}>
      <div className="container" style={{ maxWidth: 'var(--container-form-width)' }}>
        {/* Back Link */}
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            color: 'var(--color-text-tertiary)',
            fontSize: '0.875rem',
            fontWeight: 'var(--font-weight-medium)',
            marginBottom: '1.75rem',
            transition: 'color var(--transition-fast)',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        {/* Heading & Subtitle */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-navy-dark)',
            marginBottom: '0.5rem',
          }}>
            Analyze a Job Posting
          </h1>
          <p style={{
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
          }}>
            Paste the job details below. Add more details if available for a more accurate analysis.
          </p>
        </div>

        {/* Quick Demo Sample Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '0.75rem',
        }}>
          <button
            type="button"
            onClick={handleLoadSampleScam}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: '0.75rem',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-primary-blue)',
              backgroundColor: 'var(--color-primary-blue-light)',
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--color-primary-blue-border)',
            }}
          >
            <Sparkles size={13} />
            <span>Load sample scam posting</span>
          </button>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="card-base" style={{ padding: '2rem' }}>
          {/* Top Error Alert */}
          {(validationError || error) && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.875rem 1rem',
              backgroundColor: 'var(--color-risk-high-bg)',
              border: '1px solid var(--color-risk-high-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-risk-high-text)',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{validationError || error}</div>
            </div>
          )}

          {/* Primary Job Description Textarea */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
              <label htmlFor="job-description" className="form-label" style={{ margin: 0 }}>
                Job description *
              </label>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                {description.length}/5000
              </span>
            </div>
            <textarea
              id="job-description"
              className="form-input"
              rows={8}
              maxLength={5000}
              placeholder="Paste the job posting here... (e.g., from a website, email, or PDF)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{
                resize: 'vertical',
                lineHeight: 1.5,
              }}
            />
          </div>

          {/* Collapsible Optional Section Toggle */}
          <div style={{
            borderTop: '1px solid var(--color-border-subtle)',
            paddingTop: '1.25rem',
            marginBottom: isOptionalExpanded ? '1.5rem' : '1.75rem',
          }}>
            <button
              type="button"
              onClick={() => setIsOptionalExpanded(!isOptionalExpanded)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-navy-dark)',
                width: '100%',
                justifyContent: 'space-between',
              }}
              aria-expanded={isOptionalExpanded}
            >
              <span>Add more details (optional)</span>
              {isOptionalExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          {/* Expandable Optional Inputs Grid */}
          {isOptionalExpanded && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem',
              paddingBottom: '1.25rem',
              borderBottom: '1px solid var(--color-border-subtle)',
            }}>
              {/* Company Name */}
              <div>
                <label htmlFor="company-name" className="form-label">Company name</label>
                <input
                  id="company-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. OpenAI"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              {/* Recruiter Email */}
              <div>
                <label htmlFor="recruiter-email" className="form-label">Recruiter email</label>
                <input
                  id="recruiter-email"
                  type="email"
                  className="form-input"
                  placeholder="e.g. jobs@company.com"
                  value={recruiterEmail}
                  onChange={(e) => setRecruiterEmail(e.target.value)}
                />
              </div>

              {/* Website URL */}
              <div>
                <label htmlFor="website-url" className="form-label">Website URL</label>
                <input
                  id="website-url"
                  type="text"
                  className="form-input"
                  placeholder="https://company.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="form-label">Location</label>
                <input
                  id="location"
                  type="text"
                  className="form-input"
                  placeholder="e.g. New York, NY or Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              {/* Employment Type */}
              <div>
                <label htmlFor="employment-type" className="form-label">Employment type</label>
                <select
                  id="employment-type"
                  className="form-input"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                >
                  <option value="">Select type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Internship">Internship</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Salary Range */}
              <div>
                <label htmlFor="salary-range" className="form-label">Salary range</label>
                <input
                  id="salary-range"
                  type="text"
                  className="form-input"
                  placeholder="e.g. $80,000 - $120,000"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                />
              </div>

              {/* Department */}
              <div>
                <label htmlFor="department" className="form-label">Department</label>
                <input
                  id="department"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Operations / Sales"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              {/* Company Profile */}
              <div>
                <label htmlFor="company-profile" className="form-label">Company profile</label>
                <input
                  id="company-profile"
                  type="text"
                  className="form-input"
                  placeholder="Brief company description"
                  value={companyProfile}
                  onChange={(e) => setCompanyProfile(e.target.value)}
                />
              </div>

              {/* Requirements */}
              <div>
                <label htmlFor="requirements" className="form-label">Requirements</label>
                <input
                  id="requirements"
                  type="text"
                  className="form-input"
                  placeholder="Key candidate qualifications"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
              </div>

              {/* Benefits */}
              <div>
                <label htmlFor="benefits" className="form-label">Benefits</label>
                <input
                  id="benefits"
                  type="text"
                  className="form-input"
                  placeholder="Health, 401k, PTO"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                />
              </div>

              {/* Checkboxes Row */}
              <div style={{
                gridColumn: '1 / -1',
                display: 'flex',
                gap: '1.5rem',
                flexWrap: 'wrap',
                paddingTop: '0.5rem',
              }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={telecommuting}
                    onChange={(e) => setTelecommuting(e.target.checked)}
                    style={{ width: '1rem', height: '1rem', accentColor: 'var(--color-primary-blue)' }}
                  />
                  <span>Remote / Telecommuting</span>
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hasCompanyLogo}
                    onChange={(e) => setHasCompanyLogo(e.target.checked)}
                    style={{ width: '1rem', height: '1rem', accentColor: 'var(--color-primary-blue)' }}
                  />
                  <span>Company logo present</span>
                </label>

                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={hasQuestions}
                    onChange={(e) => setHasQuestions(e.target.checked)}
                    style={{ width: '1rem', height: '1rem', accentColor: 'var(--color-primary-blue)' }}
                  />
                  <span>Screening questions included</span>
                </label>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}>
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading}
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
              <RotateCcw size={15} />
              <span>Clear form</span>
            </button>

            <button
              type="submit"
              disabled={isLoading || !description.trim()}
              className="btn-primary"
              style={{
                fontSize: '0.9375rem',
                padding: '0.75rem 1.75rem',
              }}
            >
              <span>{isLoading ? 'Analyzing posting...' : 'Analyze posting'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};
