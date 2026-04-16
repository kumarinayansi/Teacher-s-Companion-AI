import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Sidebar from './Sidebar';
import '../dashboard.css';

import { useTheme } from '../context/ThemeContext';

/**
 * DashboardLayout wraps all protected inner pages with:
 * - Auth guard (redirect to /login if not signed in)
 * - Background glows
 * - Sidebar (with active-link highlighting via useLocation)
 * - Top bar with user info, search, notifications
 */
const DashboardLayout = ({ children, pageTitle, pageSubtitle, topbarTitle }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => { if (data) setProfile(data); });
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, [navigate]);

  const displayName = profile?.first_name || user?.email?.split('@')[0] || 'Teacher';

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
  const closeMobile = () => setIsMobileOpen(false);

  return (
    <>
      {/* Background */}
      <div className="dash-bg" aria-hidden="true">
        <div className="dash-glow dash-glow-1"></div>
        <div className="dash-glow dash-glow-2"></div>
        <div className="dash-grid"></div>
      </div>

      <div className="dash-layout" id="dash-layout">
        <div 
          className={`sidebar-overlay${isMobileOpen ? ' show' : ''}`} 
          id="sidebar-overlay"
          onClick={closeMobile}
        ></div>

        <Sidebar 
          user={user} 
          profile={profile} 
          isMobileOpen={isMobileOpen} 
          onMobileClose={closeMobile} 
        />

        <div className="dash-main" id="dash-main">
          {/* Topbar */}
          <header className="topbar" id="topbar">
            <div className="topbar-left">
              <button 
                className="mob-menu-btn" 
                id="mob-menu-btn" 
                aria-label="Open menu"
                onClick={toggleMobile}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <Link to="/" className="topbar-brand" id="topbar-brand">
                <span className="topbar-brand-icon">✦</span>
                <span className="topbar-brand-name">Teachers Companion AI</span>
              </Link>
              {topbarTitle && (
                <div className="topbar-page-title" style={{ display: 'flex', alignItems: 'center' }}>
                  <h1 style={{ fontSize: '1.125rem', margin: 0, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{topbarTitle}</h1>
                </div>
              )}
            </div>
            <div className="topbar-right">
              <div className="topbar-search" id="topbar-search">
                <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input type="text" className="search-input" placeholder="Search students, lessons…" id="search-input" />
                <span className="search-kbd">⌘K</span>
              </div>
              <button className="topbar-btn" id="btn-notif" aria-label="Notifications">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="btn-dot"></span>
              </button>
              <button className="topbar-btn" id="btn-theme-toggle" aria-label="Toggle Theme" onClick={toggleTheme} style={{ cursor: 'pointer' }}>
                {theme === 'light' ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </button>
              <div 
                className="topbar-profile" 
                id="topbar-profile"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8b5cf6&color=fff`} alt={displayName} className="topbar-avatar" style={{ objectFit: 'cover' }} />
                <div className="topbar-profile-info">
                  <span className="profile-name">{displayName}</span>
                  <span className="profile-role">{profile?.school_name || 'School not set'}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transition: 'transform 0.2s', transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                
                {profileDropdownOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0.5rem', minWidth: '160px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 100 }}>
                    <div style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = 'var(--card-bg-5, rgba(255,255,255,0.05))'} onMouseLeave={e => e.target.style.background = 'transparent'} onClick={() => navigate('/settings')}>Profile Information</div>
                    <div style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.875rem', color: '#ef4444', borderRadius: '6px', transition: 'background 0.2s', marginTop: '4px' }} onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.1)'} onMouseLeave={e => e.target.style.background = 'transparent'} onClick={handleSignOut}>Logout</div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="page-content" id="page-content">
            {(pageTitle || pageSubtitle) && (
              <div className="page-header" id="page-header">
                <div className="page-header-left">
                  {pageTitle && <h1 className="page-title">{pageTitle}</h1>}
                  {pageSubtitle && <p className="page-subtitle">{pageSubtitle}</p>}
                </div>
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
