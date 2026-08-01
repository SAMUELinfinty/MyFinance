import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component to guard routes on the React frontend
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {Array<string>} [props.allowedRoles]
 * @param {React.ReactNode} [props.fallback]
 */
export const ProtectedRoute = ({ children, allowedRoles, fallback }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading authentication state...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return fallback || (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You must be logged in to view this page.</p>
        <a href="/login" style={{ color: '#4F46E5', textDecoration: 'underline' }}>Go to Login</a>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Forbidden</h2>
        <p>You do not have permission to access this resource.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
