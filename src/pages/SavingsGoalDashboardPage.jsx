import React, { useState, useEffect, useCallback } from 'react';
import { savingsGoalApi } from '../services/savingsGoalApi';
import SavingsGoalFormModal from '../components/SavingsGoalFormModal';
import './SavingsGoalDashboardPage.css';

export const SavingsGoalDashboardPage = () => {
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState({
    totalTarget: 0,
    totalCurrent: 0,
    totalRemaining: 0,
    completedCount: 0,
    activeCount: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Quick contribution inputs state: key is goal ID, value is string contribution amount
  const [contributions, setContributions] = useState({});

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await savingsGoalApi.getGoals();
      setGoals(response.data.goals || []);
      setSummary(
        response.data.summary || {
          totalTarget: 0,
          totalCurrent: 0,
          totalRemaining: 0,
          completedCount: 0,
          activeCount: 0,
        }
      );
      setAlerts(response.data.alerts || []);
    } catch (err) {
      setError(err.message || 'Failed to load savings goals.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateOrUpdateGoal = async (formData) => {
    if (selectedGoal) {
      // update
      await savingsGoalApi.updateGoal(selectedGoal._id, formData);
    } else {
      // create
      await savingsGoalApi.createGoal(formData);
    }
    setSelectedGoal(null);
    fetchGoals();
  };

  const handleEditClick = (goal) => {
    setSelectedGoal(goal);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this savings goal?')) {
      try {
        await savingsGoalApi.deleteGoal(id);
        fetchGoals();
      } catch (err) {
        alert(err.message || 'Failed to delete goal.');
      }
    }
  };

  const handleContributionChange = (goalId, value) => {
    setContributions((prev) => ({
      ...prev,
      [goalId]: value,
    }));
  };

  const handleAddContribution = async (goal, e) => {
    e.preventDefault();
    const amountToAdd = contributions[goal._id];
    if (!amountToAdd || Number(amountToAdd) <= 0) {
      alert('Please enter a valid positive amount.');
      return;
    }

    const newCurrent = goal.currentAmount + Number(amountToAdd);

    try {
      await savingsGoalApi.updateGoal(goal._id, {
        currentAmount: newCurrent,
      });
      // clear input
      setContributions((prev) => ({ ...prev, [goal._id]: '' }));
      fetchGoals();
    } catch (err) {
      alert(err.message || 'Failed to add savings.');
    }
  };

  return (
    <div className="savings-dashboard-wrapper">
      <div className="savings-dashboard-container">
        
        {/* Dashboard Header */}
        <div className="dashboard-header-row">
          <div>
            <h2 className="dashboard-title">🎯 Savings Goals</h2>
            <p className="dashboard-subtitle">Define, fund, and hit your milestones easily</p>
          </div>
          <button
            className="btn-primary-glow"
            onClick={() => {
              setSelectedGoal(null);
              setIsModalOpen(true);
            }}
          >
            ➕ New Savings Goal
          </button>
        </div>

        {/* Alerts Banner */}
        {alerts.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
            {alerts.map((alert, idx) => (
              <div key={idx} className={`alert-banner ${alert.type === 'overdue' ? 'danger' : 'warning'}`}>
                <span>{alert.type === 'overdue' ? '🚨' : '⚠️'}</span>
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Metrics Row */}
        <div className="metrics-row">
          <div className="metric-card-glass limit">
            <span className="metric-lbl">Total Savings Target</span>
            <span className="metric-val">${summary.totalTarget.toLocaleString()}</span>
            <span className="metric-desc">Aggregate goal amount</span>
          </div>
          <div className="metric-card-glass spent">
            <span className="metric-lbl">Currently Saved</span>
            <span className="metric-val" style={{ color: '#34d399' }}>
              ${summary.totalCurrent.toLocaleString()}
            </span>
            <span className="metric-desc">Progress across all goals</span>
          </div>
          <div className="metric-card-glass remaining">
            <span className="metric-lbl">Remaining to Save</span>
            <span className="metric-val">${summary.totalRemaining.toLocaleString()}</span>
            <span className="metric-desc">Amount left to hit targets</span>
          </div>
          <div className="metric-card-glass alert-threshold">
            <span className="metric-lbl">Goals Met</span>
            <span className="metric-val">
              {summary.completedCount} / {goals.length}
            </span>
            <span className="metric-desc">
              {summary.activeCount} active goals remaining
            </span>
          </div>
        </div>

        {/* Goals List / Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>Loading savings goals...</div>
        ) : error ? (
          <div className="alert-banner danger">{error}</div>
        ) : goals.length === 0 ? (
          <div className="chart-card-glass" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>No Savings Goals Set Yet</h3>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
              Start your saving journey by setting up a dedicated target for emergency funds, travel plans, or a major purchase.
            </p>
            <button
              className="btn-primary-glow"
              onClick={() => {
                setSelectedGoal(null);
                setIsModalOpen(true);
              }}
            >
              🚀 Set Your First Goal
            </button>
          </div>
        ) : (
          <div className="goals-grid">
            {goals.map((goal) => {
              const progressPct = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
              const fillPct = Math.min(100, progressPct);
              
              // Deadline calculations
              const deadlineDate = new Date(goal.deadline);
              const today = new Date();
              const diffTime = deadlineDate - today;
              const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const isOverdue = daysLeft < 0;
              const isSoon = daysLeft >= 0 && daysLeft <= 30;

              return (
                <div key={goal._id} className="goal-card-glass">
                  <div>
                    {/* Header */}
                    <div className="goal-header">
                      <span className="goal-category-tag">{goal.category}</span>
                      <div className="goal-actions-dropdown">
                        <button
                          className="goal-action-icon-btn"
                          onClick={() => handleEditClick(goal)}
                          title="Edit Goal"
                        >
                          ✏️
                        </button>
                        <button
                          className="goal-action-icon-btn delete"
                          onClick={() => handleDeleteClick(goal._id)}
                          title="Delete Goal"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="goal-title">{goal.title}</h3>
                    <p className="goal-notes">
                      {goal.notes || <em style={{ color: 'rgba(255,255,255,0.3)' }}>No additional notes</em>}
                    </p>
                  </div>

                  <div>
                    {/* Progress details */}
                    <div className="goal-progress-section">
                      <div className="progress-labels-row">
                        <span>Progress</span>
                        <strong style={{ color: goal.isCompleted ? '#34d399' : '#60a5fa' }}>
                          {progressPct.toFixed(0)}%
                        </strong>
                      </div>
                      <div className="goal-track-bar">
                        <div
                          className="goal-fill-bar"
                          style={{
                            width: `${fillPct}%`,
                            background: goal.isCompleted
                              ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                              : 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                          }}
                        ></div>
                      </div>
                      <div className="progress-labels-row" style={{ fontSize: '0.8rem' }}>
                        <span>Saved: ${goal.currentAmount.toLocaleString()}</span>
                        <span>Target: ${goal.targetAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Quick Deposit Form */}
                    {!goal.isCompleted && (
                      <form
                        onSubmit={(e) => handleAddContribution(goal, e)}
                        className="contribution-row"
                      >
                        <input
                          type="number"
                          className="contribution-input"
                          placeholder="Amount ($)"
                          value={contributions[goal._id] || ''}
                          onChange={(e) => handleContributionChange(goal._id, e.target.value)}
                          min="0.01"
                          step="any"
                          required
                        />
                        <button type="submit" className="contribution-btn">
                          + Add Funds
                        </button>
                      </form>
                    )}

                    {/* Footer Deadlines */}
                    <div
                      className={`deadline-badge ${
                        goal.isCompleted
                          ? 'completed'
                          : isOverdue
                          ? 'overdue'
                          : isSoon
                          ? 'soon'
                          : ''
                      }`}
                    >
                      📅 {goal.isCompleted ? (
                        <strong>🎉 Goal Achieved!</strong>
                      ) : isOverdue ? (
                        <strong>Overdue by {Math.abs(daysLeft)} days</strong>
                      ) : (
                        <span>Deadline: {new Date(goal.deadline).toLocaleDateString()} ({daysLeft} days left)</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Savings Goal Form Modal */}
        <SavingsGoalFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedGoal(null);
          }}
          onSubmit={handleCreateOrUpdateGoal}
          initialData={selectedGoal}
        />
        
      </div>
    </div>
  );
};

export default SavingsGoalDashboardPage;
