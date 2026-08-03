import React, { useState, useEffect, useCallback } from 'react';
import { transactionApi } from '../services/transactionApi';
import { analyticsApi } from '../services/analyticsApi';
import Modal from '../components/ui/Modal';
import Toast from '../components/ui/Toast';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import './TransactionsPage.css';

export const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalCount: 0, pageSize: 10 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Filters & Search state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Selection for bulk delete
  const [selectedIds, setSelectedIds] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: 'Food & Dining',
    description: '',
    paymentMethod: 'Cash',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchCategories = async () => {
    try {
      const res = await transactionApi.getCategories();
      if (res.data) setCategories(res.data);
    } catch {
      // Ignore fallback
    }
  };

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await transactionApi.getTransactions({
        search,
        type: typeFilter,
        category: categoryFilter,
        paymentMethod: paymentMethodFilter,
        minAmount,
        maxAmount,
        startDate,
        endDate,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      setTransactions(res.data.transactions || []);
      setPagination(res.data.pagination || { currentPage: 1, totalPages: 1, totalCount: 0, pageSize: limit });
    } catch (err) {
      setToast({ message: err.message || 'Failed to fetch transactions', type: 'danger' });
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, categoryFilter, paymentMethodFilter, minAmount, maxAmount, startDate, endDate, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setFormData({
      type: 'expense',
      amount: '',
      category: 'Food & Dining',
      description: '',
      paymentMethod: 'Cash',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx) => {
    setEditingTransaction(tx);
    setFormData({
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      description: tx.description || '',
      paymentMethod: tx.paymentMethod || 'Cash',
      date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notes: tx.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingTransaction) {
        await transactionApi.updateTransaction(editingTransaction._id, formData);
        setToast({ message: 'Transaction updated successfully!', type: 'success' });
      } else {
        await transactionApi.createTransaction(formData);
        setToast({ message: 'Transaction created successfully!', type: 'success' });
      }
      setIsModalOpen(false);
      fetchTransactions();
    } catch (err) {
      setToast({ message: err.message || 'Error saving transaction', type: 'danger' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      await transactionApi.deleteTransaction(id);
      setToast({ message: 'Transaction deleted successfully', type: 'success' });
      fetchTransactions();
    } catch (err) {
      setToast({ message: err.message || 'Failed to delete transaction', type: 'danger' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected transactions?`)) return;

    try {
      await transactionApi.bulkDeleteTransactions(selectedIds);
      setToast({ message: `${selectedIds.length} transactions deleted`, type: 'success' });
      setSelectedIds([]);
      fetchTransactions();
    } catch (err) {
      setToast({ message: err.message || 'Bulk delete failed', type: 'danger' });
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(transactions.map((t) => t._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = async () => {
    try {
      await analyticsApi.downloadCSV({ startDate, endDate });
      setToast({ message: 'CSV Export downloaded', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Export failed', type: 'danger' });
    }
  };

  const handleExportExcel = async () => {
    try {
      await analyticsApi.downloadExcel({ startDate, endDate });
      setToast({ message: 'Excel Export downloaded', type: 'success' });
    } catch (err) {
      setToast({ message: err.message || 'Export failed', type: 'danger' });
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setCategoryFilter('');
    setPaymentMethodFilter('');
    setMinAmount('');
    setMaxAmount('');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="transactions-page">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />

      {/* Header & Controls Bar */}
      <div className="transactions-header">
        <div>
          <h2>Transaction Management</h2>
          <p className="text-muted">Track, search, filter, edit and export all your income & expenses</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            + Add Transaction
          </button>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            📥 Export CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportExcel}>
            📊 Export Excel
          </button>
        </div>
      </div>

      {/* Search & Filter Trigger Bar */}
      <div className="panel-card-glass mb-4">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search description, category, or notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '150px' }}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            className="form-select"
            style={{ width: '180px' }}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            ⚙️ {showFilters ? 'Hide Filters' : 'Advanced Filters'}
          </button>

          {(search || typeFilter || categoryFilter || paymentMethodFilter || minAmount || maxAmount || startDate || endDate) && (
            <button className="btn btn-ghost" onClick={handleResetFilters}>
              Reset All
            </button>
          )}
        </div>

        {/* Collapsible Advanced Filters */}
        {showFilters && (
          <div className="advanced-filters-panel" style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-primary)' }}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-select"
                  value={paymentMethodFilter}
                  onChange={(e) => {
                    setPaymentMethodFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="Crypto">Crypto</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Min Amount</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={minAmount}
                  onChange={(e) => { setMinAmount(e.target.value); setPage(1); }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Max Amount</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="10000"
                  value={maxAmount}
                  onChange={(e) => { setMaxAmount(e.target.value); setPage(1); }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sort By</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    className="form-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="date">Date</option>
                    <option value="amount">Amount</option>
                    <option value="category">Category</option>
                    <option value="type">Type</option>
                  </select>
                  <button
                    className="btn btn-secondary btn-icon"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    {sortOrder === 'asc' ? '▲' : '▼'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="alert-banner warning mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{selectedIds.length} items selected</span>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
            🗑️ Bulk Delete Selected
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="panel-card-glass" style={{ overflowX: 'auto', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem' }}>
            <LoadingSkeleton count={5} height="40px" />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No Transactions Found"
            message="No entries matched your filter criteria or search query."
            actionLabel="+ Create Transaction"
            onAction={handleOpenAddModal}
            icon="💳"
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === transactions.length && transactions.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Method</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(tx._id)}
                      onChange={() => handleSelectOne(tx._id)}
                    />
                  </td>
                  <td className="font-mono">{new Date(tx.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${tx.type === 'income' ? 'badge-success' : 'badge-danger'}`}>
                      {tx.type === 'income' ? '▲ Income' : '▼ Expense'}
                    </span>
                  </td>
                  <td>
                    <strong>{tx.category}</strong>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{tx.description || '—'}</td>
                  <td>
                    <span className="badge badge-neutral">{tx.paymentMethod || 'Cash'}</span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }} className={tx.type === 'income' ? 'text-success' : 'text-danger'}>
                    {tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => handleOpenEditModal(tx)}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => handleDelete(tx._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination Bar */}
        {!loading && pagination.totalCount > 0 && (
          <div
            style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-primary)',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalCount)} of {pagination.totalCount} entries
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Rows:</label>
              <select
                className="form-select"
                style={{ width: '70px', padding: '0.2rem 0.5rem', fontSize: 'var(--text-xs)' }}
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>

              <button
                className="btn btn-secondary btn-sm"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage(page - 1)}
              >
                ◀ Prev
              </button>
              <span style={{ fontSize: 'var(--text-sm)', padding: '0 0.5rem' }}>
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage(page + 1)}
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
      >
        <form onSubmit={handleFormSubmit} className="auth-form">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Transaction Type</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <input
                type="text"
                className="form-input"
                list="category-suggestions"
                placeholder="e.g. Food, Salary, Housing"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select
                className="form-select"
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Crypto">Crypto</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="Short transaction description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Additional details or reference notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={formLoading}>
              {formLoading ? <span className="spinner spinner-sm" /> : editingTransaction ? 'Save Changes' : 'Create Transaction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TransactionsPage;
