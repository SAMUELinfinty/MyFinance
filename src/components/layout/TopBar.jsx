import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export const TopBar = ({ toggleMobileSidebar }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <header className="dashboard-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="btn btn-ghost btn-sm btn-icon mobile-toggle-btn"
          onClick={toggleMobileSidebar}
          aria-label="Toggle Navigation"
        >
          ☰
        </button>
        <div>
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Overview</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={toggleTheme}
          title="Toggle Dark / Light Theme"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          {theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="user-avatar-placeholder">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                user.name ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div className="user-top-meta" style={{ display: 'flex', flexDirection: 'column' }}>
              <strong style={{ fontSize: '0.875rem', lineHeight: 1.2 }}>{user.name}</strong>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>● Active Session</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
