import React, { useState, useEffect } from 'react';

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

export const BudgetFormModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    monthlyLimit: '',
    alertsEnabled: true,
    alertThreshold: 85,
    categoryBudgets: [],
  });

  // Local state to manage adding a single category limit
  const [selectedCategory, setSelectedCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [categoryLimit, setCategoryLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        month: initialData.month || new Date().getMonth() + 1,
        year: initialData.year || new Date().getFullYear(),
        monthlyLimit: initialData.monthlyLimit || '',
        alertsEnabled: initialData.alertsEnabled !== undefined ? initialData.alertsEnabled : true,
        alertThreshold: initialData.alertThreshold || 85,
        categoryBudgets: initialData.categoryBudgets || [],
      });
    } else {
      setFormData({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        monthlyLimit: '',
        alertsEnabled: true,
        alertThreshold: 85,
        categoryBudgets: [],
      });
    }
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddCategoryLimit = () => {
    if (!categoryLimit || Number(categoryLimit) <= 0) {
      setError('Please enter a valid limit for the category.');
      return;
    }

    const existsIndex = formData.categoryBudgets.findIndex((c) => c.category === selectedCategory);
    let updated = [...formData.categoryBudgets];

    if (existsIndex > -1) {
      updated[existsIndex] = { category: selectedCategory, limit: Number(categoryLimit) };
    } else {
      updated.push({ category: selectedCategory, limit: Number(categoryLimit) });
    }

    setFormData((prev) => ({ ...prev, categoryBudgets: updated }));
    setCategoryLimit('');
    setError('');
  };

  const handleRemoveCategoryLimit = (categoryToRemove) => {
    const updated = formData.categoryBudgets.filter((c) => c.category !== categoryToRemove);
    setFormData((prev) => ({ ...prev, categoryBudgets: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.monthlyLimit || Number(formData.monthlyLimit) <= 0) {
      setError('Please enter a valid monthly limit.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save budget settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card-glass" style={{ maxWidth: '600px', width: '100%' }}>
        <div className="modal-header">
          <h3 className="modal-title">Configure Month Budget</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="alert-banner error" style={{ margin: '0 0 1rem 0' }}>{error}</div>}

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Month</label>
              <select
                name="month"
                className="form-input"
                value={formData.month}
                onChange={handleChange}
                required
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Year</label>
              <input
                type="number"
                name="year"
                className="form-input"
                value={formData.year}
                onChange={handleChange}
                min="2020"
                max="2100"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Total Monthly Budget Limit ($)</label>
            <input
              type="number"
              name="monthlyLimit"
              className="form-input"
              value={formData.monthlyLimit}
              onChange={handleChange}
              placeholder="e.g. 5000"
              required
            />
          </div>

          {/* Alerts settings */}
          <div className="form-grid-2" style={{ alignItems: 'center', gap: '1.5rem', margin: '1rem 0' }}>
            <div className="form-group" style={{ flexDirection: 'row', gap: '0.5rem', display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                name="alertsEnabled"
                id="alertsEnabled"
                checked={formData.alertsEnabled}
                onChange={handleChange}
              />
              <label htmlFor="alertsEnabled" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                Enable Spend Alerts
              </label>
            </div>

            {formData.alertsEnabled && (
              <div className="form-group">
                <label className="form-label">Alert Threshold: {formData.alertThreshold}%</label>
                <input
                  type="range"
                  name="alertThreshold"
                  min="50"
                  max="100"
                  value={formData.alertThreshold}
                  onChange={handleChange}
                  className="form-slider"
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

          <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '1.5rem 0' }} />

          {/* Category Budgets manager */}
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#fff' }}>Category Budgets (Optional)</h4>
          <div className="form-grid-2" style={{ gap: '0.5rem', alignItems: 'end' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Limit ($)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  className="form-input"
                  value={categoryLimit}
                  onChange={(e) => setCategoryLimit(e.target.value)}
                  placeholder="Limit"
                />
                <button
                  type="button"
                  onClick={handleAddCategoryLimit}
                  className="btn-secondary"
                  style={{ whiteSpace: 'nowrap', padding: '0 1rem' }}
                >
                  Set Limit
                </button>
              </div>
            </div>
          </div>

          <div style={{ maxHeight: '150px', overflowY: 'auto', marginTop: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '0.5rem' }}>
            {formData.categoryBudgets.length === 0 ? (
              <p style={{ margin: '0.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textAlign: 'center' }}>
                No category-specific budgets set yet.
              </p>
            ) : (
              formData.categoryBudgets.map((item) => (
                <div key={item.category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span>{item.category}: <strong>${item.limit}</strong></span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCategoryLimit(item.category)}
                    style={{ background: 'transparent', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '1rem' }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default BudgetFormModal;
