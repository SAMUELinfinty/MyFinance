import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Financial Analytics', icon: '📊' },
    { path: '/transactions', label: 'Transactions', icon: '💳' },
    { path: '/income', label: 'Income Manager', icon: '💵' },
    { path: '/budget', label: 'Budget Planner', icon: '📈' },
    { path: '/savings', label: 'Savings Goals', icon: '🎯' },
    { path: '/profile', label: 'Profile & Health', icon: '👤' },
  ];

  return (
    <aside className={`dashboard-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      <div>
        <div className="sidebar-brand">
          <span className="sidebar-logo">💎</span>
          <span className="sidebar-title">MyFinance</span>
        </div>

        <nav className="sidebar-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user-card">
            <div className="sidebar-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                user.name ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name || 'User'}</span>
              <span className="sidebar-user-email">{user.email}</span>
            </div>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={handleLogout} title="Logout">
              🚪
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
