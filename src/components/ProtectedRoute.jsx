import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component to guard routes on the React frontend
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1rem', background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
        <span className="spinner spinner-lg" />
        <p>Loading application state...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg-app)', color: 'var(--text-primary)', minHeight: '100vh' }}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view this section.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
