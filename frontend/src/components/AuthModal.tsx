import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthentiHireApiError } from '../api/client';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'signup';
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setIsSubmitting(false);
  };

  const handleTabSwitch = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login({ email: trimmedEmail, password });
      } else {
        await register({ email: trimmedEmail, password });
      }
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof AuthentiHireApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
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
          maxWidth: '440px',
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
            padding: '1.5rem 1.75rem 1.25rem',
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
              <ShieldCheck size={20} strokeWidth={2.2} />
            </div>
            <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-navy-dark)', fontSize: '1.125rem' }}>
              AuthentiHire
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '0.375rem',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-text-secondary)',
              transition: 'background-color var(--transition-fast)',
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border-default)' }}>
          <button
            onClick={() => handleTabSwitch('login')}
            style={{
              flex: 1,
              padding: '0.875rem 1rem',
              fontWeight: mode === 'login' ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
              color: mode === 'login' ? 'var(--color-primary-blue)' : 'var(--color-text-secondary)',
              borderBottom: mode === 'login' ? '2px solid var(--color-primary-blue)' : '2px solid transparent',
              backgroundColor: mode === 'login' ? '#FFFFFF' : 'var(--color-bg-subtle)',
              fontSize: '0.9375rem',
              transition: 'all var(--transition-fast)',
            }}
          >
            Log In
          </button>
          <button
            onClick={() => handleTabSwitch('signup')}
            style={{
              flex: 1,
              padding: '0.875rem 1rem',
              fontWeight: mode === 'signup' ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
              color: mode === 'signup' ? 'var(--color-primary-blue)' : 'var(--color-text-secondary)',
              borderBottom: mode === 'signup' ? '2px solid var(--color-primary-blue)' : '2px solid transparent',
              backgroundColor: mode === 'signup' ? '#FFFFFF' : 'var(--color-bg-subtle)',
              fontSize: '0.9375rem',
              transition: 'all var(--transition-fast)',
            }}
          >
            Create Account
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.75rem' }}>
          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.375rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-navy-dark)', marginBottom: '0.25rem' }}>
              {mode === 'login' ? 'Welcome back.' : 'Create your AuthentiHire account.'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              {mode === 'login'
                ? 'Sign in to access your saved analyses and fraud risk history.'
                : 'Free account to securely track and verify all your job applications.'}
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.625rem',
                backgroundColor: 'var(--color-danger-light)',
                border: '1px solid #FECACA',
                color: 'var(--color-danger-dark)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                marginBottom: '1.25rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ lineHeight: '1.4' }}>{errorMessage}</span>
            </div>
          )}

          {/* Email Field */}
          <div style={{ marginBottom: '1.125rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
              Email address
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', display: 'flex' }}>
                <Mail size={17} />
              </div>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem 0.625rem 2.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-default)',
                  fontSize: '0.9375rem',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: mode === 'signup' ? '1.125rem' : '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', display: 'flex' }}>
                <Lock size={17} />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem 0.625rem 2.5rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-default)',
                  fontSize: '0.9375rem',
                  color: 'var(--color-text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {mode === 'signup' && (
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.375rem' }}>
                Must be at least 8 characters long.
              </span>
            )}
          </div>

          {/* Confirm Password Field (Sign Up only) */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)', marginBottom: '0.375rem' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', display: 'flex' }}>
                  <Lock size={17} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem 0.625rem 2.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border-default)',
                    fontSize: '0.9375rem',
                    color: 'var(--color-text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '0.75rem',
              justifyContent: 'center',
              fontSize: '0.9375rem',
              fontWeight: 'var(--font-weight-semibold)',
              opacity: isSubmitting ? 0.7 : 1,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? (
              <span>Processing...</span>
            ) : (
              <>
                <span>{mode === 'login' ? 'Log in' : 'Create account'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Footer toggle prompt */}
          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('signup')}
                  style={{ color: 'var(--color-primary-blue)', fontWeight: 'var(--font-weight-semibold)', textDecoration: 'underline' }}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  style={{ color: 'var(--color-primary-blue)', fontWeight: 'var(--font-weight-semibold)', textDecoration: 'underline' }}
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
