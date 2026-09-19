import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Loader2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMinLength = password.length >= 8;
  const isMaxLength = password.length <= 128;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (!isMinLength) {
      setLocalError('Password must be at least 8 characters in length.');
      return;
    }
    if (!isMaxLength) {
      setLocalError('Password must not exceed 128 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ email: email.trim(), password });
      navigate('/app/dashboard', { replace: true });
    } catch {
      setLocalError('Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError;

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        backgroundColor: '#F8FAFC',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #EAECF0',
          boxShadow: '0 12px 32px -4px rgba(11, 31, 58, 0.08), 0 2px 6px rgba(11, 31, 58, 0.04)',
          padding: '2.5rem',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#EFF8FF',
              color: '#1677FF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.025em', margin: 0 }}>
            Create your account
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#667085', marginTop: '0.375rem' }}>
            Start analyzing job postings and track your risk history
          </p>
        </div>

        {/* Error Alert */}
        {displayError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              backgroundColor: '#FEF3F2',
              border: '1px solid #FECDCA',
              color: '#B42318',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{displayError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label className="form-label" htmlFor="register-email">
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                style={{ paddingLeft: '2.25rem' }}
              />
              <Mail
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="register-password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                style={{ paddingLeft: '2.25rem', paddingRight: '2.25rem' }}
              />
              <Lock
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="form-label" htmlFor="register-confirm">
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="register-confirm"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                style={{ paddingLeft: '2.25rem' }}
              />
              <Lock
                size={16}
                color="#94A3B8"
                style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Password Policy Checks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.75rem', color: '#667085' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: isMinLength ? '#027A48' : '#667085' }}>
              <Check size={13} color={isMinLength ? '#12B76A' : '#CBD5E1'} />
              <span>At least 8 characters</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: passwordsMatch ? '#027A48' : '#667085' }}>
              <Check size={13} color={passwordsMatch ? '#12B76A' : '#CBD5E1'} />
              <span>Passwords match</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              marginTop: '0.5rem',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem', color: '#667085' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600, color: '#1677FF' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
