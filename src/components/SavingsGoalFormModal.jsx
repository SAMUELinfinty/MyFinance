import React, { useState, useEffect } from 'react';

const SAVINGS_CATEGORIES = [
  'Emergency Fund',
  'Retirement',
  'Travel',
  'Vehicle',
  'Home',
  'Education',
  'Gadgets',
  'Other',
];

export const SavingsGoalFormModal = ({ isOpen, onClose, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    targetAmount: '',
    currentAmount: '0',
    deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // default 90 days from now
    category: 'Other',
    notificationsEnabled: true,
    notes: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        targetAmount: initialData.targetAmount || '',
        currentAmount: initialData.currentAmount !== undefined ? initialData.currentAmount : '0',
        deadline: initialData.deadline ? new Date(initialData.deadline).toISOString().split('T')[0] : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: initialData.category || 'Other',
        notificationsEnabled: initialData.notificationsEnabled !== undefined ? initialData.notificationsEnabled : true,
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        title: '',
        targetAmount: '',
        currentAmount: '0',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        category: 'Other',
        notificationsEnabled: true,
        notes: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (Number(formData.targetAmount) <= 0) {
      setError('Target amount must be greater than zero.');
      return;
    }
    if (Number(formData.currentAmount) < 0) {
      setError('Current amount cannot be negative.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save savings goal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card-glass" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="modal-header">
          <h3 className="modal-title">{initialData ? 'Edit Savings Goal' : 'Create Savings Goal'}</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="alert-banner error" style={{ margin: '0 0 1rem 0', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '0.5rem 1rem', borderRadius: '8px' }}>{error}</div>}

          <div className="form-group">
            <label className="form-label">Goal Title</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Tesla Model 3 Fund"
              required
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Target Amount ($)</label>
              <input
                type="number"
                name="targetAmount"
                className="form-input"
                value={formData.targetAmount}
                onChange={handleChange}
                placeholder="e.g. 35000"
                min="0.01"
                step="any"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Already Saved ($)</label>
              <input
                type="number"
                name="currentAmount"
                className="form-input"
                value={formData.currentAmount}
                onChange={handleChange}
                placeholder="e.g. 5000"
                min="0"
                step="any"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Target Deadline</label>
              <input
                type="date"
                name="deadline"
                className="form-input"
                value={formData.deadline}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                name="category"
                className="form-input"
                value={formData.category}
                onChange={handleChange}
              >
                {SAVINGS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{ flexDirection: 'row', gap: '0.5rem', display: 'flex', alignItems: 'center', margin: '0.75rem 0' }}>
            <input
              type="checkbox"
              name="notificationsEnabled"
              id="notificationsEnabled"
              checked={formData.notificationsEnabled}
              onChange={handleChange}
            />
            <label htmlFor="notificationsEnabled" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
              Enable Progress & Deadline Notifications
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              name="notes"
              className="form-input"
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. Monthly transfer target is $500"
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : initialData ? 'Update Goal' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default SavingsGoalFormModal;
