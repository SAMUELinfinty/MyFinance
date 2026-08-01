import React, { useState, useEffect } from 'react';
import { profileApi } from '../services/profileApi';
import AvatarUpload from '../components/AvatarUpload';
import FinancialHealthCard from '../components/FinancialHealthCard';
import './ProfilePage.css';

export const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'health' | 'edit' | 'settings'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    phone: '',
    jobTitle: '',
    location: '',
    currency: 'USD',
    monthlyIncomeGoal: 5000,
    savingsTarget: 1500,
    settings: {
      theme: 'dark',
      emailAlerts: true,
      monthlyReports: true,
      securityAlerts: true,
    },
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await profileApi.getProfile();
      setProfileData(res.data);

      const u = res.data.user;
      const p = res.data.profile;

      setFormData({
        name: u.name || '',
        bio: p.bio || '',
        phone: p.phone || '',
        jobTitle: p.jobTitle || '',
        location: p.location || '',
        currency: p.currency || 'USD',
        monthlyIncomeGoal: p.monthlyIncomeGoal || 5000,
        savingsTarget: p.savingsTarget || 1500,
        settings: {
          theme: p.settings?.theme || 'dark',
          emailAlerts: p.settings?.emailAlerts ?? true,
          monthlyReports: p.settings?.monthlyReports ?? true,
          securityAlerts: p.settings?.securityAlerts ?? true,
        },
      });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load user profile' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAvatarUpdate = (newAvatarUrl, _updatedUser) => {
    setProfileData((prev) => ({
      ...prev,
      user: { ...prev.user, avatar: newAvatarUrl },
    }));
    setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSettingToggle = (settingKey) => {
    setFormData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [settingKey]: !prev.settings[settingKey],
      },
    }));
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await profileApi.updateProfile(formData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      await fetchProfile();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDemoData = async () => {
    try {
      setSaving(true);
      await profileApi.seedDemoData();
      setMessage({ type: 'success', text: 'Demo financial transactions seeded successfully!' });
      await fetchProfile();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to seed demo data' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page-wrapper">
        <div className="profile-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h3>Loading User Profile...</h3>
        </div>
      </div>
    );
  }

  const { user, profile, summary, financialHealth } = profileData || {};
  const currencySymbol = { USD: '$', EUR: '€', GBP: '£', INR: '₹', CAD: 'CA$', AUD: 'A$', JPY: '¥' }[formData.currency] || '$';

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">

        {/* Status Toast Message */}
        {message.text && (
          <div className={`alert-toast ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Profile Header Banner Card */}
        <div className="profile-banner-card">
          <AvatarUpload
            avatarUrl={user?.avatar}
            userName={user?.name}
            onUploadSuccess={handleAvatarUpdate}
          />

          <div className="banner-info-group">
            <h1 className="user-display-name">{user?.name}</h1>
            <p className="user-title-text">{profile?.jobTitle || 'Finance Member'} • {user?.email}</p>
            <div className="banner-meta-badges">
              {user?.isEmailVerified ? (
                <span className="meta-badge verified">✓ Verified Email</span>
              ) : (
                <span className="meta-badge" style={{ color: '#F59E0B' }}>⚠ Unverified Email</span>
              )}
              <span className="meta-badge">Member since {new Date(user?.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              <span className="meta-badge">{profile?.currency || 'USD'} Currency</span>
            </div>
          </div>

          <div className="banner-actions-group">
            <button className="btn-primary" onClick={() => setActiveTab('edit')}>
              Edit Profile
            </button>
            <button className="btn-secondary" onClick={handleSeedDemoData} disabled={saving}>
              {saving ? 'Seeding...' : '⚡ Seed Demo Data'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs-nav">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview & Analytics
          </button>
          <button
            className={`tab-button ${activeTab === 'health' ? 'active' : ''}`}
            onClick={() => setActiveTab('health')}
          >
            Financial Health ({financialHealth?.score || 0}/100)
          </button>
          <button
            className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            Edit Profile
          </button>
          <button
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Account Settings
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div>
            <div className="summary-cards-grid">
              <div className="summary-card">
                <div className="summary-card-header">
                  <span className="card-title">Monthly Income</span>
                  <div className="card-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>📈</div>
                </div>
                <div className="card-value">{currencySymbol}{summary?.monthlyIncome?.toLocaleString()}</div>
                <div className="card-subtext">Goal: {currencySymbol}{profile?.monthlyIncomeGoal?.toLocaleString()} / mo</div>
              </div>

              <div className="summary-card">
                <div className="summary-card-header">
                  <span className="card-title">Monthly Expenses</span>
                  <div className="card-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>📉</div>
                </div>
                <div className="card-value">{currencySymbol}{summary?.monthlyExpense?.toLocaleString()}</div>
                <div className="card-subtext">{summary?.monthlyIncome > 0 ? `${((summary?.monthlyExpense / summary?.monthlyIncome) * 100).toFixed(0)}% of income spent` : 'No income logged'}</div>
              </div>

              <div className="summary-card">
                <div className="summary-card-header">
                  <span className="card-title">Net Monthly Savings</span>
                  <div className="card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>💰</div>
                </div>
                <div className="card-value" style={{ color: summary?.netSavings >= 0 ? '#10B981' : '#EF4444' }}>
                  {currencySymbol}{summary?.netSavings?.toLocaleString()}
                </div>
                <div className="card-subtext">Target: {currencySymbol}{profile?.savingsTarget?.toLocaleString()} / mo</div>
              </div>

              <div className="summary-card">
                <div className="summary-card-header">
                  <span className="card-title">Savings Rate</span>
                  <div className="card-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>🎯</div>
                </div>
                <div className="card-value">{summary?.savingsRate}%</div>
                <div className="card-subtext">{summary?.savingsRate >= 20 ? '✅ Healthy (≥20% Benchmark)' : '⚠️ Below 20% Goal'}</div>
              </div>
            </div>

            <FinancialHealthCard healthData={financialHealth} />
          </div>
        )}

        {/* TAB 2: FINANCIAL HEALTH SCORE */}
        {activeTab === 'health' && (
          <FinancialHealthCard healthData={financialHealth} />
        )}

        {/* TAB 3: EDIT PROFILE */}
        {activeTab === 'edit' && (
          <div className="form-card">
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Edit Personal & Financial Profile</h3>
            <form onSubmit={handleSubmitProfile}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Job Title / Role</label>
                  <input
                    type="text"
                    name="jobTitle"
                    className="form-input"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    placeholder="e.g. Software Engineer, Designer"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    className="form-input"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Currency</label>
                  <select
                    name="currency"
                    className="form-select"
                    value={formData.currency}
                    onChange={handleInputChange}
                  >
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="CAD">CAD (CA$) - Canadian Dollar</option>
                    <option value="AUD">AUD (A$) - Australian Dollar</option>
                    <option value="JPY">JPY (¥) - Japanese Yen</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Income Goal ({currencySymbol})</label>
                  <input
                    type="number"
                    name="monthlyIncomeGoal"
                    className="form-input"
                    value={formData.monthlyIncomeGoal}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Monthly Savings Target ({currencySymbol})</label>
                  <input
                    type="number"
                    name="savingsTarget"
                    className="form-input"
                    value={formData.savingsTarget}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Bio / About Me</label>
                <textarea
                  name="bio"
                  className="form-textarea"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Share a short bio or your personal financial objectives..."
                ></textarea>
              </div>

              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: ACCOUNT SETTINGS */}
        {activeTab === 'settings' && (
          <div className="form-card">
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Account Preferences & Settings</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Manage notification controls, display theme, and account security.
            </p>

            <div className="settings-section-title">Notifications</div>

            <div className="setting-toggle-row">
              <div className="toggle-info">
                <h5>Email Notifications</h5>
                <p>Receive transaction updates and weekly financial digests</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.settings.emailAlerts}
                  onChange={() => handleSettingToggle('emailAlerts')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-toggle-row">
              <div className="toggle-info">
                <h5>Monthly Financial Reports</h5>
                <p>Get automated end-of-month breakdown of savings and health score</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.settings.monthlyReports}
                  onChange={() => handleSettingToggle('monthlyReports')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-toggle-row">
              <div className="toggle-info">
                <h5>Security Alerts</h5>
                <p>Receive immediate alerts for new logins and password changes</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.settings.securityAlerts}
                  onChange={() => handleSettingToggle('securityAlerts')}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="settings-section-title">Appearance</div>

            <div className="form-group" style={{ maxWidth: '300px', marginBottom: '1.5rem' }}>
              <label className="form-label">Theme Mode</label>
              <select
                className="form-select"
                value={formData.settings.theme}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, theme: e.target.value },
                  }))
                }
              >
                <option value="dark">Dark Glass (Recommended)</option>
                <option value="light">Light Mode</option>
                <option value="system">System Default</option>
              </select>
            </div>

            <button type="button" className="btn-primary" onClick={handleSubmitProfile} disabled={saving}>
              {saving ? 'Updating Settings...' : 'Save Settings'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfilePage;
