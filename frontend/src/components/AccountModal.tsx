import React from 'react';
import { X, UserCheck, Mail, Calendar, Shield, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHistory?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onOpenHistory,
}) => {
  const { user, logout } = useAuth();

  if (!isOpen || !user) return null;

  const formattedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Active Member';

  const handleLogout = async () => {
    await logout();
    onClose();
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
          maxWidth: '480px',
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
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-primary-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <UserCheck size={18} />
            </div>
            <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-navy-dark)', fontSize: '1.125rem' }}>
              My Account
            </span>
          </div>

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

        {/* Modal Body */}
        <div style={{ padding: '1.75rem' }}>
          {/* User Profile Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1.25rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border-default)',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                width: '3.25rem',
                height: '3.25rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-navy-dark)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem',
                fontWeight: 'var(--font-weight-bold)',
                flexShrink: 0,
              }}
            >
              {user.email.substring(0, 2).toUpperCase()}
            </div>

            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '1rem', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-navy-dark)', wordBreak: 'break-all' }}>
                {user.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginTop: '0.25rem' }}>
                <CheckCircle2 size={14} color="var(--color-success)" />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 'var(--font-weight-semibold)' }}>
                  Active AuthentiHire Account
                </span>
              </div>
            </div>
          </div>

          {/* Account Details List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                <Mail size={16} />
                <span>Email Address</span>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                {user.email}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                <Calendar size={16} />
                <span>Member Since</span>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-primary)' }}>
                {formattedDate}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                <Shield size={16} />
                <span>Account ID</span>
              </div>
              <code style={{ fontSize: '0.75rem', fontFamily: 'monospace', backgroundColor: 'var(--color-bg-subtle)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                {user.id.substring(0, 13)}...
              </code>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {onOpenHistory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenHistory();
                }}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.625rem', justifyContent: 'center', fontSize: '0.875rem' }}
              >
                View History
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              style={{
                flex: 1,
                padding: '0.625rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #FECACA',
                backgroundColor: 'var(--color-danger-light)',
                color: 'var(--color-danger-dark)',
                fontWeight: 'var(--font-weight-semibold)',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'background-color var(--transition-fast)',
              }}
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
