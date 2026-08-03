import { apiFetch } from './api';

export const transactionApi = {
  /**
   * Fetch paginated transactions with search, filter, and sort options
   */
  getTransactions: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const queryString = query.toString();
    return apiFetch(`/transactions${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },

  /**
   * Fetch single transaction by ID
   */
  getTransactionById: (id) => apiFetch(`/transactions/${id}`, { method: 'GET' }),

  /**
   * Create new transaction
   */
  createTransaction: (data) =>
    apiFetch('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update existing transaction
   */
  updateTransaction: (id, data) =>
    apiFetch(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete transaction
   */
  deleteTransaction: (id) =>
    apiFetch(`/transactions/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Bulk delete transactions
   */
  bulkDeleteTransactions: (ids) =>
    apiFetch('/transactions/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),

  /**
   * Get categories list
   */
  getCategories: () => apiFetch('/transactions/categories', { method: 'GET' }),
};

export default transactionApi;
