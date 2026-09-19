import React, { useState } from 'react';
import { ShieldCheck, Menu, X, ArrowRight, User as UserIcon, LogIn, UserPlus, History, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentView: 'home' | 'analyze' | 'results' | 'dashboard' | 'history';
  onNavigate: (view: 'home' | 'analyze' | 'dashboard' | 'history') => void;
  onOpenModal: (modal: 'how-it-works' | 'about' | 'resources') => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onOpenAccount: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenModal,
  onOpenAuth,
  onOpenAccount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'AH';

  return (
    <header style={{
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid var(--color-border-default)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '4.25rem',
      }}>
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            textDecoration: 'none',
            color: 'var(--color-text-primary)',
          }}
          aria-label="AuthentiHire Home"
        >
          <div style={{
            width: '2.25rem',
            height: '2.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-primary-blue-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary-blue)',
          }}>
            <ShieldCheck size={22} strokeWidth={2.2} />
          </div>
          <span style={{
            fontSize: '1.25rem',
            fontWeight: 'var(--font-weight-bold)',
            letterSpacing: '-0.025em',
            color: 'var(--color-navy-dark)',
          }}>
            AuthentiHire
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <nav style={{
          display: 'none',
          alignItems: 'center',
          gap: '1.75rem',
        }} className="desktop-nav">
          {isAuthenticated && (
            <button
              onClick={() => onNavigate('dashboard')}
              style={{
                fontSize: '0.9375rem',
                fontWeight: currentView === 'dashboard' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                color: currentView === 'dashboard' ? 'var(--color-primary-blue)' : 'var(--color-text-secondary)',
                transition: 'color var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </button>
          )}

          <button
            onClick={() => onNavigate('analyze')}
            style={{
              fontSize: '0.9375rem',
              fontWeight: currentView === 'analyze' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
              color: currentView === 'analyze' ? 'var(--color-primary-blue)' : 'var(--color-text-secondary)',
              transition: 'color var(--transition-fast)',
            }}
          >
            Analyze
          </button>
          
          <button
            onClick={() => onNavigate('history')}
            style={{
              fontSize: '0.9375rem',
              fontWeight: currentView === 'history' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
              color: currentView === 'history' ? 'var(--color-primary-blue)' : 'var(--color-text-secondary)',
              transition: 'color var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}
          >
            <History size={16} />
            <span>History</span>
          </button>

          <button
            onClick={() => onOpenModal('how-it-works')}
            style={{
              fontSize: '0.9375rem',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-secondary)',
              transition: 'color var(--transition-fast)',
            }}
          >
            How It Works
          </button>
          <button
            onClick={() => onOpenModal('about')}
            style={{
              fontSize: '0.9375rem',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-secondary)',
              transition: 'color var(--transition-fast)',
            }}
          >
            About
          </button>
          <button
            onClick={() => onOpenModal('resources')}
            style={{
              fontSize: '0.9375rem',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-secondary)',
              transition: 'color var(--transition-fast)',
            }}
          >
            Resources
          </button>
        </nav>

        {/* Desktop Right Actions */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          gap: '0.875rem',
        }} className="desktop-actions">
          {currentView !== 'analyze' && (
            <button
              onClick={() => onNavigate('analyze')}
              className="btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              <span>Analyze a Job</span>
              <ArrowRight size={14} />
            </button>
          )}

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <button
                onClick={onOpenAccount}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-border-default)',
                  backgroundColor: 'var(--color-bg-subtle)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                title={user?.email || 'My Account'}
              >
                <div style={{
                  width: '1.75rem',
                  height: '1.75rem',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--color-primary-blue)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.6875rem',
                  fontWeight: 'var(--font-weight-bold)',
                }}>
                  {userInitials}
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-navy-dark)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email?.split('@')[0]}
                </span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => onOpenAuth('login')}
                className="btn-secondary"
                style={{ padding: '0.5rem 0.875rem', fontSize: '0.875rem' }}
              >
                <LogIn size={15} />
                <span>Log in</span>
              </button>
              <button
                onClick={() => onOpenAuth('signup')}
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-primary-blue)',
                  padding: '0.5rem 0.75rem',
                  cursor: 'pointer',
                }}
              >
                Create account
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-text-primary)',
          }}
          className="mobile-menu-btn"
          aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid var(--color-border-default)',
          padding: '1.25rem 1.5rem 1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.875rem',
        }} className="mobile-drawer">
          {isAuthenticated && (
            <button
              onClick={() => { onNavigate('dashboard'); setMobileMenuOpen(false); }}
              style={{
                textAlign: 'left',
                fontSize: '1rem',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-primary-blue)',
                padding: '0.375rem 0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <LayoutDashboard size={18} />
              <span>User Dashboard</span>
            </button>
          )}

          <button
            onClick={() => { onNavigate('analyze'); setMobileMenuOpen(false); }}
            style={{
              textAlign: 'left',
              fontSize: '1rem',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-navy-dark)',
              padding: '0.375rem 0',
            }}
          >
            Analyze a Job Posting
          </button>
          
          <button
            onClick={() => { onNavigate('history'); setMobileMenuOpen(false); }}
            style={{
              textAlign: 'left',
              fontSize: '1rem',
              color: 'var(--color-text-primary)',
              padding: '0.375rem 0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <History size={18} />
            <span>Analysis History</span>
          </button>

          <button
            onClick={() => { onOpenModal('how-it-works'); setMobileMenuOpen(false); }}
            style={{
              textAlign: 'left',
              fontSize: '1rem',
              color: 'var(--color-text-primary)',
              padding: '0.375rem 0',
            }}
          >
            How It Works
          </button>
          <button
            onClick={() => { onOpenModal('about'); setMobileMenuOpen(false); }}
            style={{
              textAlign: 'left',
              fontSize: '1rem',
              color: 'var(--color-text-primary)',
              padding: '0.375rem 0',
            }}
          >
            About AuthentiHire
          </button>
          <button
            onClick={() => { onOpenModal('resources'); setMobileMenuOpen(false); }}
            style={{
              textAlign: 'left',
              fontSize: '1rem',
              color: 'var(--color-text-primary)',
              padding: '0.375rem 0',
            }}
          >
            Resources & Scam Types
          </button>

          <div style={{ borderTop: '1px solid var(--color-border-default)', paddingTop: '0.875rem', marginTop: '0.25rem' }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                <button
                  onClick={() => { onOpenAccount(); setMobileMenuOpen(false); }}
                  className="btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <UserIcon size={16} />
                  <span>My Account ({user?.email?.split('@')[0]})</span>
                </button>
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  style={{
                    width: '100%',
                    padding: '0.625rem',
                    textAlign: 'center',
                    color: 'var(--color-danger)',
                    fontSize: '0.875rem',
                    fontWeight: 'var(--font-weight-medium)',
                  }}
                >
                  Log out
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.625rem' }}>
                <button
                  onClick={() => { onOpenAuth('login'); setMobileMenuOpen(false); }}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Log in
                </button>
                <button
                  onClick={() => { onOpenAuth('signup'); setMobileMenuOpen(false); }}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Create account
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responsive Styles Injection */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .desktop-actions { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
          .mobile-drawer { display: none !important; }
        }
      `}</style>
    </header>
  );
};
