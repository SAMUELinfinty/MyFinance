import React, { useState, useEffect, useCallback } from 'react';
import { incomeApi } from '../services/incomeApi';
import IncomeCharts from '../components/IncomeCharts';
import IncomeFormModal from '../components/IncomeFormModal';
import './IncomeDashboardPage.css';

const CATEGORY_COLORS = {
  Salary: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' },
  Freelance: { bg: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' },
  Investments: { bg: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' },
  Business: { bg: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' },
  Rental: { bg: 'rgba(236, 72, 153, 0.15)', color: '#EC4899' },
  'Side Hustle': { bg: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' },
  Gift: { bg: 'rgba(20, 184, 166, 0.15)', color: '#14B8A6' },
  Other: { bg: 'rgba(100, 116, 139, 0.15)', color: '#94A3B8' },
};

export const IncomeDashboardPage = () => {
  const [incomes, setIncomes] = useState([]);
  const [report, setReport] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalCount: 0 });
  const [queryTotalAmount, setQueryTotalAmount] = useState(0);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    isRecurring: '',
    startDate: '',
    endDate: '',
  });

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [toast, setToast] = useState({ type: '', text: '' });

  const fetchIncomeData = useCallback(async () => {
    try {
      setLoading(true);
      const [incomeRes, reportRes] = await Promise.all([
        incomeApi.getIncomes({
          page: pagination.page,
          limit: pagination.limit,
          search: filters.search,
          category: filters.category,
          isRecurring: filters.isRecurring,
          startDate: filters.startDate,
          endDate: filters.endDate,
        }),
        incomeApi.getIncomeReport(),
      ]);

      setIncomes(incomeRes.data.incomes);
      setPagination(incomeRes.data.pagination);
      setQueryTotalAmount(incomeRes.data.queryTotalAmount);
      setReport(reportRes.data);
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Failed to load income data' });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchIncomeData();
  }, [fetchIncomeData]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({ search: '', category: '', isRecurring: '', startDate: '', endDate: '' });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCreateOrUpdate = async (formData) => {
    try {
      if (selectedIncome) {
        await incomeApi.updateIncome(selectedIncome._id, formData);
        setToast({ type: 'success', text: 'Income entry updated successfully' });
      } else {
        await incomeApi.createIncome(formData);
        setToast({ type: 'success', text: 'Income entry created successfully' });
      }
      setSelectedIncome(null);
      await fetchIncomeData();
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Operation failed' });
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income entry?')) return;
    try {
      await incomeApi.deleteIncome(id);
      setToast({ type: 'success', text: 'Income record deleted' });
      await fetchIncomeData();
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Failed to delete income' });
    }
  };

  const handleToggleRecurring = async (id) => {
    try {
      await incomeApi.toggleRecurringStatus(id);
      setToast({ type: 'success', text: 'Recurring status toggled' });
      await fetchIncomeData();
    } catch (err) {
      setToast({ type: 'error', text: err.message || 'Failed to toggle status' });
    }
  };

  return (
    <div className="income-dashboard-wrapper">
      <div className="income-dashboard-container">

        {/* Status Toast */}
        {toast.text && (
          <div className={`alert-toast ${toast.type}`} style={{ marginBottom: '1.5rem' }}>
            {toast.text}
          </div>
        )}

        {/* Header Row */}
        <div className="dashboard-header-row">
          <div>
            <h1 className="dashboard-title">Income Management</h1>
            <p className="dashboard-subtitle">Track, categorize, and analyze your revenue streams</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setSelectedIncome(null);
              setIsModalOpen(true);
            }}
          >
            + Add New Income
          </button>
        </div>

        {/* Summary Stat Cards */}
        <div className="summary-cards-grid">
          <div className="summary-card">
            <div className="summary-card-header">
              <span className="card-title">Current Month Income</span>
              <div className="card-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>💵</div>
            </div>
            <div className="card-value">${report?.totalMonthlyIncome?.toLocaleString() || '0'}</div>
            <div className="card-subtext">Total received this month</div>
          </div>

          <div className="summary-card">
            <div className="summary-card-header">
              <span className="card-title">Recurring Projection</span>
              <div className="card-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#6366F1' }}>🔄</div>
            </div>
            <div className="card-value">${report?.projectedMonthlyRecurring?.toLocaleString() || '0'} / mo</div>
            <div className="card-subtext">{report?.recurringCount || 0} active recurring streams</div>
          </div>

          <div className="summary-card">
            <div className="summary-card-header">
              <span className="card-title">Filtered Total</span>
              <div className="card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>📊</div>
            </div>
            <div className="card-value">${queryTotalAmount?.toLocaleString() || '0'}</div>
            <div className="card-subtext">Matching current search query</div>
          </div>
        </div>

        {/* Interactive Charts */}
        <IncomeCharts reportData={report} currencySymbol="$" />

        {/* Search & Filter Toolbar */}
        <div className="filter-toolbar-card">
          <div className="search-input-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              name="search"
              placeholder="Search income title or notes..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>

          <div className="filter-selects-group">
            <select
              name="category"
              className="filter-select"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">All Categories</option>
              <option value="Salary">Salary</option>
              <option value="Freelance">Freelance</option>
              <option value="Investments">Investments</option>
              <option value="Business">Business</option>
              <option value="Rental">Rental</option>
              <option value="Side Hustle">Side Hustle</option>
              <option value="Gift">Gift</option>
              <option value="Other">Other</option>
            </select>

            <select
              name="isRecurring"
              className="filter-select"
              value={filters.isRecurring}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              <option value="true">Recurring Only</option>
              <option value="false">One-time Only</option>
            </select>

            <input
              type="date"
              name="startDate"
              className="filter-select"
              value={filters.startDate}
              onChange={handleFilterChange}
              title="Start Date"
            />

            <input
              type="date"
              name="endDate"
              className="filter-select"
              value={filters.endDate}
              onChange={handleFilterChange}
              title="End Date"
            />

            {(filters.search || filters.category || filters.isRecurring || filters.startDate || filters.endDate) && (
              <button className="btn-secondary" onClick={handleClearFilters}>
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Income Data Table */}
        <div className="table-card-glass">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading records...</td>
                  </tr>
                ) : incomes.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No income records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  incomes.map((item) => {
                    const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
                    return (
                      <tr key={item._id}>
                        <td>
                          <strong>{item.title}</strong>
                          {item.notes && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.notes}</div>}
                        </td>
                        <td>
                          <span
                            className="category-badge"
                            style={{ backgroundColor: catStyle.bg, color: catStyle.color }}
                          >
                            {item.category}
                          </span>
                        </td>
                        <td style={{ color: '#10B981', fontWeight: '700' }}>
                          +${item.amount?.toLocaleString()}
                        </td>
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                        <td>
                          {item.isRecurring ? (
                            <span
                              className="recurring-pill"
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleToggleRecurring(item._id)}
                              title="Click to toggle active/paused"
                            >
                              🔄 {item.recurringFrequency} ({item.recurringStatus})
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>One-time</span>
                          )}
                        </td>
                        <td>
                          <div className="action-btn-group">
                            <button
                              className="action-icon-btn"
                              title="Edit Entry"
                              onClick={() => {
                                setSelectedIncome(item);
                                setIsModalOpen(true);
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              className="action-icon-btn delete"
                              title="Delete Entry"
                              onClick={() => handleDelete(item._id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pagination-bar">
            <div className="page-info-text">
              Showing {incomes.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} entries
            </div>

            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={!pagination.hasPrevPage}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="page-btn"
                disabled={!pagination.hasNextPage}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Income Form Modal */}
      <IncomeFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIncome(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={selectedIncome}
      />
    </div>
  );
};

export default IncomeDashboardPage;
