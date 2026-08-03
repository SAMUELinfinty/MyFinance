import { apiFetch } from './api';

export const expenseApi = {
  /**
   * Fetch paginated and filtered expense records
   */
  getExpenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/expenses${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  /**
   * Create new expense record
   */
  createExpense: (data) =>
    apiFetch('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update existing expense record
   */
  updateExpense: (id, data) =>
    apiFetch(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete expense record
   */
  deleteExpense: (id) =>
    apiFetch(`/expenses/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Toggle recurring expense status
   */
  toggleRecurringStatus: (id) =>
    apiFetch(`/expenses/${id}/toggle-recurring`, {
      method: 'PATCH',
    }),
};
