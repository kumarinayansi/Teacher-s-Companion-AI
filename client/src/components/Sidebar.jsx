import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const navItems = [
  {
    section: 'Main',
    links: [
      { to: '/dashboard', label: 'Dashboard', id: 'nav-dashboard', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      )},
      { to: '/lessons', label: 'Lessons', id: 'nav-lessons', badge: '12', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )},
      { to: '/assignments', label: 'Assignments', id: 'nav-assignments', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      )},
      { to: '/students', label: 'Students', id: 'nav-students', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )},
      { to: '/grading', label: 'Grading', id: 'nav-grading', badgeAlert: '5', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )},
      { to: '/analytics', label: 'Analytics', id: 'nav-analytics', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      )},
    ]
  },
  {
    section: 'Tools',
    links: [
      { to: '/chat', label: 'AI Assistant', id: 'nav-ai', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      )},
      { to: '/library', label: 'Library', id: 'nav-library', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      )},
    ]
  },
  {
    section: 'Account',
    links: [
      { to: '/settings', label: 'Settings', id: 'nav-settings', icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )},
    ]
  },
];

const Sidebar = ({ user, profile, isMobileOpen, onMobileClose }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const displayName = profile?.first_name || user?.email?.split('@')[0] || 'Teacher';
  const roleDisplay = profile?.school_name || 'School not set';

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <aside className={`sidebar${isCollapsed ? ' collapsed' : ''}${isMobileOpen ? ' mob-open' : ''}`} id="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo" id="sidebar-logo">
            <span className="logo-icon">✦</span>
            <span className="sidebar-logo-text">Teachers Companion AI</span>
          </Link>
          <button 
            className="sidebar-toggle" 
            id="sidebar-toggle" 
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleCollapse}
          >
            ☰
          </button>
        </div>

        <nav className="sidebar-nav" id="sidebar-nav">
          {navItems.map(({ section, links }) => (
            <div key={section}>
              <div className="nav-section-label">{section}</div>
              {links.map(({ to, label, id, icon, badge, badgeAlert }) => (
                <Link
                  key={to}
                  to={to}
                  className={`sidebar-link${location.pathname === to ? ' active' : ''}`}
                  id={id}
                  data-label={label}
                  onClick={onMobileClose}
                >
                  <span className="nav-icon">{icon}</span>
                  <span className="nav-label">{label}</span>
                  {badge && <span className="nav-badge">{badge}</span>}
                  {badgeAlert && <span className="nav-badge nav-badge-alert">{badgeAlert}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>

      <div 
        className="sidebar-user" 
        onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        <img
          src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=8b5cf6&color=fff`}
          alt={displayName}
          className="sidebar-avatar"
          style={{ objectFit: 'cover' }}
        />
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{displayName}</div>
          <div className="sidebar-user-role">{roleDisplay}</div>
        </div>
        <button
          className="sidebar-logout"
          title="Profile Options"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s', transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {profileDropdownOpen && (
          <div style={{ position: 'absolute', bottom: 'calc(100% + 10px)', left: 0, width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0.5rem', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)', zIndex: 100 }}>
            <div style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.875rem', color: 'var(--text-primary)', borderRadius: '6px', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = 'var(--card-bg-5, rgba(255,255,255,0.05))'} onMouseLeave={e => e.target.style.background = 'transparent'} onClick={() => navigate('/settings')}>Profile Information</div>
            <div style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '0.875rem', color: '#ef4444', borderRadius: '6px', transition: 'background 0.2s', marginTop: '4px' }} onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.1)'} onMouseLeave={e => e.target.style.background = 'transparent'} onClick={handleSignOut}>Logout</div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
