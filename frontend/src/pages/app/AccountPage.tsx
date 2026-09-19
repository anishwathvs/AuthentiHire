import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Mail, Calendar, Key, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ padding: '2.5rem 2rem 4rem', maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
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
          <User size={14} color="#1677FF" />
          <span>Account Settings</span>
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0B1F3A', letterSpacing: '-0.03em', margin: 0 }}>
          Profile & Security
        </h1>
        <p style={{ fontSize: '1rem', color: '#667085', marginTop: '0.375rem' }}>
          Manage your AuthentiHire credentials, security settings, and session.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Profile Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #EAECF0',
            padding: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0B1F3A', marginBottom: '1.5rem' }}>
            Account Information
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid #F2F4F7' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF8FF',
                  color: '#1677FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Mail size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#98A2B3', fontWeight: 600, textTransform: 'uppercase' }}>
                  Registered Email Address
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0B1F3A', marginTop: '2px' }}>
                  {user?.email || 'N/A'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid #F2F4F7' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  backgroundColor: '#ECFDF3',
                  color: '#027A48',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#98A2B3', fontWeight: 600, textTransform: 'uppercase' }}>
                  Account Status
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#027A48', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <CheckCircle2 size={16} />
                  <span>Active & Verified</span>
                </div>
              </div>
            </div>

            {user?.created_at && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: '#F8FAFC',
                    color: '#667085',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#98A2B3', fontWeight: 600, textTransform: 'uppercase' }}>
                    Member Since
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0B1F3A', marginTop: '2px' }}>
                    {new Date(user.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security Controls */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #EAECF0',
            padding: '2rem',
          }}
        >
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0B1F3A', marginBottom: '1rem' }}>
            Security & Authentication
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#667085', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Your account is secured with OWASP-recommended <strong>Argon2id</strong> cryptographic password hashing and signed <strong>HttpOnly JWT session cookies</strong> with SameSite protection.
          </p>

          <div style={{ borderTop: '1px solid #F2F4F7', paddingTop: '1.5rem' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6875rem 1.25rem',
                borderRadius: '8px',
                backgroundColor: '#FEF3F2',
                color: '#B42318',
                fontWeight: 600,
                fontSize: '0.875rem',
                border: '1px solid #FECDCA',
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
              <span>Log out of AuthentiHire</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
