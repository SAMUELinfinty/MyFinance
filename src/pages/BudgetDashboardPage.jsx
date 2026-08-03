import React, { useState, useEffect, useCallback } from 'react';
import { budgetApi } from '../services/budgetApi';
import { expenseApi } from '../services/expenseApi';
import BudgetFormModal from '../components/BudgetFormModal';
import BudgetCharts from '../components/BudgetCharts';
import './BudgetDashboardPage.css';

const EXPENSE_CATEGORIES = [
  'Housing',
  'Food & Dining',
  'Transportation',
  'Healthcare',
  'Shopping',
  'Entertainment',
  'Utilities',
  'Education',
  'Travel',
  'Insurance',
  'Personal Care',
  'Subscriptions',
  'Debt Payment',
  'Savings Transfer',
  'Other',
];

export const BudgetDashboardPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [budgetData, setBudgetData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Quick log expense form state
  const [quickExpense, setQuickExpense] = useState({
    title: '',
    amount: '',
    category: EXPENSE_CATEGORIES[0],
    date: new Date().toISOString().split('T')[0],
  });
  const [loggingExpense, setLoggingExpense] = useState(false);
  const [quickExpenseError, setQuickExpenseError] = useState('');
  const [quickExpenseSuccess, setQuickExpenseSuccess] = useState('');

  const fetchBudgetDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await budgetApi.getBudget({
        month: selectedMonth,
        year: selectedYear,
      });
      setBudgetData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load budget details.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await budgetApi.getBudgetHistory();
      setHistoryData(response.data.history || []);
    } catch {
      // Fail silently for history chart
    }
  }, []);

  useEffect(() => {
    fetchBudgetDetails();
  }, [fetchBudgetDetails]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleBudgetSubmit = async (formData) => {
    await budgetApi.upsertBudget(formData);
    // Refresh
    fetchBudgetDetails();
    fetchHistory();
  };

  const handleQuickExpenseChange = (e) => {
    const { name, value } = e.target;
    setQuickExpense((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuickExpenseSubmit = async (e) => {
    e.preventDefault();
    setQuickExpenseError('');
    setQuickExpenseSuccess('');

    if (!quickExpense.title.trim()) {
      setQuickExpenseError('Title is required');
      return;
    }
    if (!quickExpense.amount || Number(quickExpense.amount) <= 0) {
      setQuickExpenseError('Amount must be positive');
      return;
    }

    setLoggingExpense(true);
    try {
      await expenseApi.createExpense({
        ...quickExpense,
        amount: Number(quickExpense.amount),
        isRecurring: false,
        recurringFrequency: 'one-time',
        paymentMethod: 'Other',
      });
      setQuickExpenseSuccess('Expense logged successfully!');
      setQuickExpense({
        title: '',
        amount: '',
        category: EXPENSE_CATEGORIES[0],
        date: new Date().toISOString().split('T')[0],
      });
      // Refresh budget dashboard to reflect new expense
      fetchBudgetDetails();
      fetchHistory();
    } catch (err) {
      setQuickExpenseError(err.message || 'Failed to log expense');
    } finally {
      setLoggingExpense(false);
    }
  };

  const currentBudget = budgetData?.budget;
  const totalSpent = budgetData?.totalSpent || 0;
  const remaining = budgetData?.remaining || 0;
  const isBudgetConfigured = !!currentBudget;
  const overallLimit = currentBudget ? currentBudget.monthlyLimit : 0;
  const thresholdPct = budgetData?.alertThreshold || 85;
  const overallAlertTriggered = budgetData?.overallAlertTriggered || false;

  // Calculate overall progress percentage
  const utilizationPct = overallLimit > 0 ? (totalSpent / overallLimit) * 100 : 0;

  return (
    <div className="budget-dashboard-wrapper">
      <div className="budget-dashboard-container">
        
        {/* Dashboard Header */}
        <div className="dashboard-header-row">
          <div>
            <h2 className="dashboard-title">📈 Budget Planner</h2>
            <p className="dashboard-subtitle">Set, track, and optimize your monthly budget targets</p>
          </div>
          <button className="btn-primary-glow" onClick={() => setIsModalOpen(true)}>
            ⚙️ Configure Budget
          </button>
        </div>

        {/* Filters */}
        <div className="filter-card-glass">
          <div className="filter-selects">
            <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Filter Month:</span>
            <select
              className="form-input-dark"
              style={{ width: '130px', padding: '0.4rem 0.6rem' }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              className="form-input-dark"
              style={{ width: '100px', padding: '0.4rem 0.6rem' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {Array.from({ length: 7 }, (_, i) => 2024 + i).map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
              Status: {isBudgetConfigured ? '🟢 Budget Active' : '⚪ Budget Unconfigured'}
            </span>
          </div>
        </div>

        {/* Alert Banner */}
        {isBudgetConfigured && overallAlertTriggered && (
          <div className={`alert-banner ${utilizationPct >= 100 ? 'danger' : 'warning'}`}>
            {utilizationPct >= 100 ? (
              <>🚨 <strong>Budget Exceeded!</strong> You have spent ${totalSpent.toLocaleString()} which is over your limit of ${overallLimit.toLocaleString()}.</>
            ) : (
              <>⚠️ <strong>Approaching Budget Limit!</strong> You have spent {utilizationPct.toFixed(0)}% of your monthly limit (${totalSpent.toLocaleString()} of ${overallLimit.toLocaleString()}).</>
            )}
          </div>
        )}

        {/* Metrics Summary Row */}
        <div className="metrics-row">
          <div className="metric-card-glass limit">
            <span className="metric-lbl">Monthly Budget Limit</span>
            <span className="metric-val">${overallLimit.toLocaleString()}</span>
            <span className="metric-desc">Target limit for {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'short' })} {selectedYear}</span>
          </div>
          <div className="metric-card-glass spent">
            <span className="metric-lbl">Total Spent</span>
            <span className="metric-val">${totalSpent.toLocaleString()}</span>
            <span className="metric-desc">Actual logged expenses</span>
          </div>
          <div className="metric-card-glass remaining">
            <span className="metric-lbl">Remaining Balance</span>
            <span className="metric-val" style={{ color: remaining < 0 ? '#f87171' : '#34d399' }}>
              {remaining < 0 ? `-$${Math.abs(remaining).toLocaleString()}` : `$${remaining.toLocaleString()}`}
            </span>
            <span className="metric-desc">{remaining < 0 ? 'Over limit' : 'Left to spend'}</span>
          </div>
          <div className="metric-card-glass alert-threshold">
            <span className="metric-lbl">Alert Threshold</span>
            <span className="metric-val">{isBudgetConfigured ? `${thresholdPct}%` : 'Disabled'}</span>
            <span className="metric-desc">{isBudgetConfigured && currentBudget.alertsEnabled ? 'Alert triggers when threshold met' : 'Notifications off'}</span>
          </div>
        </div>

        {/* Visual Charts Component */}
        {!loading && (
          <BudgetCharts
            categoryProgress={budgetData?.categoryProgress || []}
            historyData={historyData}
          />
        )}

        {/* Quick Log Test Expense Form */}
        <div className="chart-card-glass quick-expense-section">
          <h3 className="chart-title">📝 Quick Log Test Expense</h3>
          <p className="dashboard-subtitle" style={{ marginBottom: '1.25rem' }}>
            Add an expense directly to instantly view updated budget progress and alert bars.
          </p>

          <form onSubmit={handleQuickExpenseSubmit}>
            {quickExpenseError && <div className="alert-banner danger" style={{ padding: '0.5rem 1rem', margin: '0 0 1rem 0' }}>{quickExpenseError}</div>}
            {quickExpenseSuccess && <div className="alert-banner success" style={{ padding: '0.5rem 1rem', margin: '0 0 1rem 0' }}>{quickExpenseSuccess}</div>}

            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label" style={{ color: '#94a3b8' }}>Expense Title</label>
                <input
                  type="text"
                  name="title"
                  className="form-input-dark"
                  value={quickExpense.title}
                  onChange={handleQuickExpenseChange}
                  placeholder="e.g. Grocery Shop"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#94a3b8' }}>Amount ($)</label>
                <input
                  type="number"
                  name="amount"
                  className="form-input-dark"
                  value={quickExpense.amount}
                  onChange={handleQuickExpenseChange}
                  placeholder="e.g. 150"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#94a3b8' }}>Category</label>
                <select
                  name="category"
                  className="form-input-dark"
                  value={quickExpense.category}
                  onChange={handleQuickExpenseChange}
                >
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn-primary-glow"
                  style={{ width: '100%', padding: '0.65rem' }}
                  disabled={loggingExpense}
                >
                  {loggingExpense ? 'Logging...' : 'Log Expense'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Modal config */}
        <BudgetFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleBudgetSubmit}
          initialData={currentBudget}
        />
        
      </div>
    </div>
  );
};

export default BudgetDashboardPage;
