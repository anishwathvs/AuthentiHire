import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  FileSearch,
  History,
  Bookmark,
  Shield,
  Flag,
  Info,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const username = user?.email ? user.email.split('@')[0] : 'user';
  const initial = (username[0] || 'U').toUpperCase();

  const navItemStyle = ({ isActive }: { isActive: boolean }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.625rem 0.875rem',
    borderRadius: '8px',
    color: isActive ? '#FFFFFF' : '#475467',
    backgroundColor: isActive ? '#2563EB' : 'transparent',
    fontWeight: isActive ? 600 : 500,
    fontSize: '0.875rem',
    textDecoration: 'none',
    transition: 'all 0.15s ease',
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Desktop Left Sidebar */}
      <aside
        style={{
          width: '240px',
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #EAECF0',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
        }}
        className="app-sidebar"
      >
        {/* Brand Header */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid #F2F4F7' }}>
          <Link
            to="/app/dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                flexShrink: 0,
              }}
            >
              <Briefcase size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#0F172A', lineHeight: 1.15 }}>
                Authenti<span style={{ color: '#2563EB' }}>Hire</span>
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#94A3B8', marginTop: '1px', fontWeight: 500 }}>
                Safer Opportunities. Brighter Futures.
              </div>
            </div>
          </Link>
        </div>

        {/* Main Navigation Links */}
        <nav
          style={{
            flex: 1,
            padding: '1rem 0.875rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem',
            overflowY: 'auto',
          }}
        >
          <NavLink to="/app/dashboard" style={navItemStyle}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/app/analyze" style={navItemStyle}>
            <FileSearch size={18} />
            <span>New Job Analysis</span>
          </NavLink>
          <NavLink to="/app/history" style={navItemStyle}>
            <History size={18} />
            <span>Analysis History</span>
          </NavLink>
          <NavLink to="/app/history?filter=saved" style={navItemStyle}>
            <Bookmark size={18} />
            <span>Saved Postings</span>
          </NavLink>

          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#94A3B8', padding: '1rem 0.5rem 0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Resources
          </div>
          <NavLink to="/resources" style={navItemStyle}>
            <Shield size={18} />
            <span>Safety Guidelines</span>
          </NavLink>
          <NavLink to="/resources#red-flags" style={navItemStyle}>
            <Flag size={18} />
            <span>Red Flag Examples</span>
          </NavLink>
          <NavLink to="/about" style={navItemStyle}>
            <Info size={18} />
            <span>About AuthentiHire</span>
          </NavLink>
        </nav>

        {/* Sidebar Bottom Promo Banner */}
        <div style={{ padding: '0.875rem 1rem 1.25rem' }}>
          <div
            style={{
              position: 'relative',
              borderRadius: '12px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #DBEAFE',
              padding: '1rem 0.875rem',
              overflow: 'hidden',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#1E3A8A', lineHeight: 1.3, marginBottom: '0.75rem' }}>
              Spot Scams<br />
              Stay Safe<br />
              Build Your Future
            </div>

            {/* Candidate & Signpost Illustration */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.25rem' }}>
              <svg width="150" height="90" viewBox="0 0 150 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Ground */}
                <ellipse cx="75" cy="82" rx="65" ry="7" fill="#BFDBFE" opacity="0.6" />
                
                {/* Signpost Post */}
                <rect x="92" y="30" width="6" height="52" rx="2" fill="#64748B" />
                
                {/* REAL JOBS Sign (Green) */}
                <path d="M72 32H118L124 38L118 44H72V32Z" fill="#10B981" />
                <text x="76" y="40.5" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">REAL JOBS</text>
                
                {/* SCAMS Sign (Red) */}
                <path d="M120 48H80L74 54L80 60H120V48Z" fill="#EF4444" />
                <text x="85" y="56.5" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">SCAMS</text>
                
                {/* Candidate Figure (Backpack) */}
                {/* Backpack */}
                <rect x="26" y="50" width="14" height="20" rx="4" fill="#1D4ED8" />
                {/* Body */}
                <path d="M38 52C38 48 42 46 47 46C52 46 56 48 56 52V76H38V52Z" fill="#2563EB" />
                {/* Head */}
                <circle cx="47" cy="38" r="7" fill="#FBBF24" />
                {/* Cap */}
                <path d="M40 36C40 33 43 31 47 31C51 31 54 33 54 36H40Z" fill="#0F172A" />
                <rect x="36" y="35" width="10" height="2" rx="1" fill="#0F172A" />
                {/* Legs */}
                <rect x="40" y="74" width="5" height="10" rx="1" fill="#1E293B" />
                <rect x="48" y="74" width="5" height="10" rx="1" fill="#1E293B" />
              </svg>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Viewport */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Navbar */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 2rem',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #EAECF0',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          {/* Left: Mobile Toggle & Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              style={{
                display: 'none',
                padding: '0.375rem',
                borderRadius: '6px',
                border: '1px solid #EAECF0',
                background: 'none',
                cursor: 'pointer',
              }}
              className="app-mobile-menu-btn"
              aria-label="Toggle navigation drawer"
            >
              {mobileDrawerOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Right: User Profile Avatar & Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.375rem 0.625rem',
                borderRadius: '9999px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
              aria-expanded={userDropdownOpen}
              aria-haspopup="true"
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {initial}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                {user?.email || 'user'}
              </span>
              <ChevronDown size={14} color="#64748B" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: '0.5rem',
                  width: '200px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #EAECF0',
                  boxShadow: '0 10px 25px -5px rgba(11, 31, 58, 0.1), 0 0 1px rgba(11, 31, 58, 0.2)',
                  padding: '0.5rem',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}
              >
                <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid #F2F4F7', fontSize: '0.75rem', color: '#64748B' }}>
                  Signed in as <strong style={{ color: '#0F172A', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</strong>
                </div>
                <Link
                  to="/app/account"
                  onClick={() => setUserDropdownOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8125rem',
                    color: '#344054',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontWeight: 500,
                  }}
                >
                  <User size={15} />
                  <span>Account & Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    handleLogout();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: '0.8125rem',
                    color: '#EF4444',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                  }}
                >
                  <LogOut size={15} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Drawer */}
        {mobileDrawerOpen && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #EAECF0',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.375rem',
            }}
            className="app-mobile-drawer"
          >
            <NavLink to="/app/dashboard" onClick={() => setMobileDrawerOpen(false)} style={navItemStyle}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/app/analyze" onClick={() => setMobileDrawerOpen(false)} style={navItemStyle}>
              <FileSearch size={18} />
              <span>New Job Analysis</span>
            </NavLink>
            <NavLink to="/app/history" onClick={() => setMobileDrawerOpen(false)} style={navItemStyle}>
              <History size={18} />
              <span>Analysis History</span>
            </NavLink>
            <NavLink to="/app/account" onClick={() => setMobileDrawerOpen(false)} style={navItemStyle}>
              <User size={18} />
              <span>Account & Settings</span>
            </NavLink>
            <button
              onClick={() => {
                setMobileDrawerOpen(false);
                handleLogout();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.875rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#FEF2F2',
                color: '#EF4444',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                marginTop: '0.5rem',
              }}
            >
              <LogOut size={18} />
              <span>Log out</span>
            </button>
          </div>
        )}

        {/* Nested App Content Viewport */}
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
