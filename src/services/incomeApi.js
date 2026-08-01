import { apiFetch } from './api';

export const incomeApi = {
  /**
   * Fetch paginated and filtered income records
   */
  getIncomes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/income${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  /**
   * Fetch single income details by ID
   */
  getIncomeById: (id) => apiFetch(`/income/${id}`, { method: 'GET' }),

  /**
   * Create new income record
   */
  createIncome: (data) =>
    apiFetch('/income', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update existing income record
   */
  updateIncome: (id, data) =>
    apiFetch(`/income/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete income record
   */
  deleteIncome: (id) =>
    apiFetch(`/income/${id}`, {
      method: 'DELETE',
    }),

  /**
   * Get Monthly Income Report & Category Breakdown
   */
  getIncomeReport: () => apiFetch('/income/report', { method: 'GET' }),

  /**
   * Toggle recurring income status (Active / Paused)
   */
  toggleRecurringStatus: (id) =>
    apiFetch(`/income/${id}/toggle-recurring`, {
      method: 'PATCH',
    }),
};
