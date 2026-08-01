import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import ProfilePage from './pages/ProfilePage';
import IncomeDashboardPage from './pages/IncomeDashboardPage';
import './App.css';

function MainAppContent() {
  const [currentTab, setCurrentTab] = useState('income'); // 'income' | 'profile'

  return (
    <div className="app-main">
      {/* Global Navbar */}
      <nav className="global-navbar">
        <div className="nav-brand">
          <span className="brand-logo">💎</span>
          <span className="brand-title">MyFinance</span>
        </div>
        <div className="nav-links">
          <button
            className={`nav-link-btn ${currentTab === 'income' ? 'active' : ''}`}
            onClick={() => setCurrentTab('income')}
          >
            💵 Income Management
          </button>
          <button
            className={`nav-link-btn ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => setCurrentTab('profile')}
          >
            👤 User Profile & Health
          </button>
        </div>
      </nav>

      {/* View Switcher */}
      {currentTab === 'income' ? <IncomeDashboardPage /> : <ProfilePage />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
