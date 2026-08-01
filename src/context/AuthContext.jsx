import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, setMemoryToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Refresh token on app start
        const refreshData = await authApi.refreshToken();
        if (refreshData?.data?.accessToken) {
          setMemoryToken(refreshData.data.accessToken);
          const userData = await authApi.getCurrentUser();
          setUser(userData.data.user);
        }
      } catch {
        // User not logged in or refresh token expired
        setUser(null);
        setMemoryToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    setMemoryToken(res.data.accessToken);
    setUser(res.data.user);
    return res;
  };

  const register = async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    setMemoryToken(res.data.accessToken);
    setUser(res.data.user);
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setMemoryToken(null);
      setUser(null);
    }
  };

  const googleLogin = async (idToken) => {
    const res = await authApi.googleLogin(idToken);
    setMemoryToken(res.data.accessToken);
    setUser(res.data.user);
    return res;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    googleLogin,
    verifyEmail: authApi.verifyEmail,
    forgotPassword: authApi.forgotPassword,
    resetPassword: authApi.resetPassword,
    changePassword: authApi.changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
