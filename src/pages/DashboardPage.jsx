import React, { useState, useEffect } from 'react';
import { dashboardApi } from '../services/dashboardApi';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

const CATEGORY_COLORS = {
  Housing: '#3B82F6',        // Blue
  'Food & Dining': '#F59E0B', // Amber
  Transportation: '#10B981', // Emerald
  Healthcare: '#EF4444',     // Red
  Shopping: '#EC4899',       // Pink
  Entertainment: '#8B5CF6',  // Purple
  Utilities: '#06B6D4',      // Cyan
  Education: '#6366F1',      // Indigo
  Travel: '#14B8A6',         // Teal
  Insurance: '#F97316',      // Orange
  'Personal Care': '#D946EF', // Magenta
  Subscriptions: '#84CC16',  // Lime
  'Debt Payment': '#64748B',  // Slate
  'Savings Transfer': '#059669', // Emerald dark
  Other: '#475569',          // Slate dark
};

export const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await dashboardApi.getSummary();
        setData(response.data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'rgba(255,255,255,0.6)', backgroundColor: '#0b0f19', minHeight: '100vh' }}>
        <h2>Loading dashboard analytics...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', backgroundColor: '#0b0f19', minHeight: '100vh' }}>
        <div className="alert-banner danger">{error}</div>
      </div>
    );
  }

  const {
    totalBalance = 0,
    monthlyIncome = 0,
    monthlyExpenses = 0,
    totalSavings = 0,
    budget = { limit: 0, spent: 0, percentage: 0 },
    recentTransactions = [],
    expenseCategories = [],
    topSpending = [],
    monthlyTrends = [],
  } = data || {};

  // Donut SVG Calculations for Expense Categories
  const totalCategoryExpenses = expenseCategories.reduce((sum, c) => sum + c.total, 0);
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  // Max value for trend bars
  const maxTrendVal = Math.max(
    ...monthlyTrends.map((t) => Math.max(t.income, t.expense)),
    100
  );

  return (
    <div style={{ backgroundColor: '#0b0f19', minHeight: '100vh', padding: '1rem' }}>
      
      {/* Top Navbar Info */}
      <div className="dashboard-top-navbar">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.65rem' }}>Financial Analytics</h2>
          <p style={{ margin: '0.2rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            {new Date().toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="user-profile-widget">
          <div className="user-avatar-placeholder">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : 'MF'
            )}
          </div>
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>{user?.name || 'Finance Owner'}</strong>
            <span style={{ fontSize: '0.8rem', color: '#10b981' }}>{user?.isEmailVerified ? '✓ Verified Account' : 'Finance Member'}</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-grid-cards">
        <div className="metric-card-glass limit">
          <span className="metric-lbl">Total Net Balance</span>
          <span className="metric-val" style={{ color: totalBalance >= 0 ? '#34d399' : '#f87171' }}>
            ${totalBalance.toLocaleString()}
          </span>
          <span className="metric-desc">Aggregate overall cash</span>
        </div>
        <div className="metric-card-glass spent">
          <span className="metric-lbl">Monthly Earnings</span>
          <span className="metric-val" style={{ color: '#60a5fa' }}>
            ${monthlyIncome.toLocaleString()}
          </span>
          <span className="metric-desc">Income recorded this month</span>
        </div>
        <div className="metric-card-glass remaining">
          <span className="metric-lbl">Monthly Spending</span>
          <span className="metric-val" style={{ color: '#fb7185' }}>
            ${monthlyExpenses.toLocaleString()}
          </span>
          <span className="metric-desc">Expenses logged this month</span>
        </div>
        <div className="metric-card-glass alert-threshold">
          <span className="metric-lbl">Saved Stash</span>
          <span className="metric-val" style={{ color: '#a78bfa' }}>
            ${totalSavings.toLocaleString()}
          </span>
          <span className="metric-desc">Total goals current savings</span>
        </div>
      </div>

      {/* Trend & Budget/Categories Breakdown Row */}
      <div className="dashboard-charts-row">
        
        {/* Trend chart */}
        <div className="panel-card-glass">
          <h4 className="panel-title">Income vs Expenses (6-Month Trend)</h4>
          <div style={{ height: '200px', display: 'flex', alignItems: 'end', gap: '1.5rem', marginTop: '1.5rem' }}>
            {monthlyTrends.map((t, idx) => {
              const incPct = (t.income / maxTrendVal) * 100;
              const expPct = (t.expense / maxTrendVal) * 100;

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '4px', height: '150px', alignItems: 'end', width: '100%' }}>
                    {/* Income Bar */}
                    <div style={{ flex: 1, height: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', position: 'relative', display: 'flex', alignItems: 'end' }}>
                      <div
                        style={{
                          height: `${Math.max(4, incPct)}%`,
                          width: '100%',
                          background: 'linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)',
                          borderRadius: '3px',
                        }}
                        title={`Income: $${t.income}`}
                      ></div>
                    </div>
                    {/* Expense Bar */}
                    <div style={{ flex: 1, height: '100%', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', position: 'relative', display: 'flex', alignItems: 'end' }}>
                      <div
                        style={{
                          height: `${Math.max(4, expPct)}%`,
                          width: '100%',
                          background: 'linear-gradient(180deg, #f43f5e 0%, #be123c 100%)',
                          borderRadius: '3px',
                        }}
                        title={`Expense: $${t.expense}`}
                      ></div>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>{t.label}</span>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1rem', fontSize: '0.85rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', background: '#60a5fa', borderRadius: '2px' }}></span>
              Income
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '10px', height: '10px', background: '#f43f5e', borderRadius: '2px' }}></span>
              Expense
            </span>
          </div>
        </div>

        {/* Budget Progress Meter */}
        <div className="panel-card-glass" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h4 className="panel-title">Month Budget Usage</h4>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '1rem 0' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '120px', height: '120px' }}>
              <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke={budget.percentage >= 100 ? '#ef4444' : budget.percentage >= 85 ? '#f59e0b' : '#10b981'}
                  strokeWidth="10"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - budget.percentage / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{budget.percentage.toFixed(0)}%</span>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Spent</span>
              </div>
            </div>
            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#94a3b8' }}>
              <span>${budget.spent.toLocaleString()} spent of <strong>${budget.limit.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

      </div>

      {/* Categories & Transactions Lists */}
      <div className="dashboard-details-row">
        
        {/* Expense Category Shares */}
        <div className="panel-card-glass">
          <h4 className="panel-title">Expense Categories Share</h4>
          {expenseCategories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No expenses logged this month</div>
          ) : (
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              {/* Doughnut SVG */}
              <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                <svg viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                  <circle cx="70" cy="70" r={radius} strokeWidth="12" fill="none" stroke="rgba(255,255,255,0.06)" />
                  {expenseCategories.map((c, idx) => {
                    const percent = totalCategoryExpenses > 0 ? c.total / totalCategoryExpenses : 0;
                    const strokeDasharray = `${percent * circumference} ${circumference}`;
                    const strokeDashoffset = -cumulativePercent * circumference;
                    cumulativePercent += percent;
                    const strokeColor = CATEGORY_COLORS[c.category] || '#6366F1';

                    return (
                      <circle
                        key={idx}
                        cx="70"
                        cy="70"
                        r={radius}
                        strokeWidth="12"
                        fill="none"
                        stroke={strokeColor}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Legend with shares */}
              <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                {expenseCategories.slice(0, 4).map((c, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: CATEGORY_COLORS[c.category] || '#6366F1' }}></span>
                      {c.category}
                    </span>
                    <span>{c.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions List */}
        <div className="panel-card-glass">
          <h4 className="panel-title">Recent Activity</h4>
          {recentTransactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.4)' }}>No transaction logs available</div>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Details</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.map((tx) => (
                    <tr key={tx._id}>
                      <td>
                        <strong style={{ display: 'block', fontSize: '0.85rem' }}>{tx.description || 'Quick Log'}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(tx.date).toLocaleDateString()}</span>
                      </td>
                      <td>
                        <span className={`tag-badge ${tx.type}`}>{tx.category}</span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: tx.type === 'income' ? '#34d399' : '#fb7185' }}>
                        {tx.type === 'income' ? `+` : `-`}${tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default DashboardPage;
