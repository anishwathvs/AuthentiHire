import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShieldCheck, Menu, X, ArrowRight, UserCircle, LogOut, LayoutDashboard, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const PublicLayout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    color: isActive ? '#1677FF' : '#475467',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.9375rem',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    padding: '0.375rem 0.625rem',
    borderRadius: '6px',
    backgroundColor: isActive ? '#F0F7FF' : 'transparent',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Public Top Navbar */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.92)' : '#FFFFFF',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: '1px solid #EAECF0',
          transition: 'all 0.25s ease',
          boxShadow: scrolled ? '0 4px 20px -2px rgba(11, 31, 58, 0.06)' : 'none',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: scrolled ? '0.75rem 1.5rem' : '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'padding 0.2s ease',
          }}
        >
          {/* Brand Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                background: 'linear-gradient(135deg, #1677FF 0%, #003EB3 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(22, 119, 255, 0.25)',
              }}
            >
              <ShieldCheck size={20} color="#FFFFFF" />
            </div>
            <div>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: '#0B1F3A',
                }}
              >
                Authenti<span style={{ color: '#1677FF' }}>Hire</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '1.5rem',
            }}
            className="desktop-nav"
          >
            <NavLink to="/how-it-works" style={navLinkStyle}>
              How It Works
            </NavLink>
            <NavLink to="/about" style={navLinkStyle}>
              About
            </NavLink>
            <NavLink to="/resources" style={navLinkStyle}>
              Resources
            </NavLink>
          </nav>

          {/* Right Action CTAs */}
          <div
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '0.875rem',
            }}
            className="desktop-nav"
          >
            {isAuthenticated ? (
              <>
                <Link
                  to="/app/dashboard"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    backgroundColor: '#F0F7FF',
                    color: '#1677FF',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    border: '1px solid #BAE0FF',
                  }}
                >
                  <LayoutDashboard size={15} />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/app/analyze"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1.125rem',
                    borderRadius: '8px',
                    backgroundColor: '#1677FF',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(22, 119, 255, 0.25)',
                  }}
                >
                  <Search size={15} />
                  <span>Analyze Posting</span>
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#0B1F3A',
                    textDecoration: 'none',
                    borderRadius: '6px',
                  }}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.5rem 1.125rem',
                    borderRadius: '8px',
                    backgroundColor: '#1677FF',
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(22, 119, 255, 0.25)',
                  }}
                >
                  <span>Create account</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'inline-flex',
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid #EAECF0',
              backgroundColor: '#FFFFFF',
              color: '#0B1F3A',
              cursor: 'pointer',
            }}
            className="mobile-toggle"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '1rem 1.5rem 1.5rem',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #EAECF0',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <Link
              to="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: '#0B1F3A', fontWeight: 600, padding: '0.5rem 0' }}
            >
              How It Works
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: '#0B1F3A', fontWeight: 600, padding: '0.5rem 0' }}
            >
              About
            </Link>
            <Link
              to="/resources"
              onClick={() => setMobileMenuOpen(false)}
              style={{ textDecoration: 'none', color: '#0B1F3A', fontWeight: 600, padding: '0.5rem 0' }}
            >
              Resources
            </Link>
            <div style={{ borderTop: '1px solid #F2F4F7', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/app/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      textAlign: 'center',
                      padding: '0.625rem',
                      borderRadius: '8px',
                      backgroundColor: '#F0F7FF',
                      color: '#1677FF',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Go to Dashboard
                  </Link>
                  <Link
                    to="/app/analyze"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      textAlign: 'center',
                      padding: '0.625rem',
                      borderRadius: '8px',
                      backgroundColor: '#1677FF',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Analyze Posting
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      textAlign: 'center',
                      padding: '0.625rem',
                      borderRadius: '8px',
                      border: '1px solid #EAECF0',
                      color: '#0B1F3A',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      textAlign: 'center',
                      padding: '0.625rem',
                      borderRadius: '8px',
                      backgroundColor: '#1677FF',
                      color: '#FFFFFF',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Body */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Marketing Footer */}
      <footer
        style={{
          backgroundColor: '#071324',
          color: '#94A3B8',
          padding: '4rem 1.5rem 2.5rem',
          borderTop: '1px solid #1E293B',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '3rem',
            marginBottom: '3.5rem',
          }}
        >
          {/* Brand Info */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#1677FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={18} color="#FFFFFF" />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF' }}>
                Authenti<span style={{ color: '#1677FF' }}>Hire</span>
              </span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#94A3B8', maxWidth: '340px' }}>
              Evidence-based job fraud detection uniting calibrated machine learning, heuristic scam rules, and verifiable company intelligence.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Product
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <li>
                <Link to="/app/analyze" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  Analyze Posting
                </Link>
              </li>
              <li>
                <Link to="/app/dashboard" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/app/history" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  Analysis History
                </Link>
              </li>
            </ul>
          </div>

          {/* Learn Links */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Learn
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <li>
                <Link to="/how-it-works" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/about" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  About AuthentiHire
                </Link>
              </li>
              <li>
                <Link to="/resources" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                  Safety Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h4 style={{ color: '#FFFFFF', fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Account
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              {isAuthenticated ? (
                <>
                  <li>
                    <Link to="/app/account" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                      Account Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={() => logout()}
                      style={{ background: 'none', border: 'none', padding: 0, color: '#94A3B8', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      Log out
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" style={{ color: '#94A3B8', textDecoration: 'none' }}>
                      Create account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Legal / Disclaimer */}
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            paddingTop: '2rem',
            borderTop: '1px solid #1E293B',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            fontSize: '0.8125rem',
          }}
        >
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} AuthentiHire. Screening tool for risk assessment; not an endorsement or legal guarantee.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link to="/resources" style={{ color: '#94A3B8', textDecoration: 'none' }}>
              Methodology & Limitations
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
