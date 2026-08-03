import { apiFetch } from './api';

export const budgetApi = {
  /**
   * Fetch budget details and progress for a month and year
   */
  getBudget: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/budget/current${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  /**
   * Create or update budget settings
   */
  upsertBudget: (data) =>
    apiFetch('/budget', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Fetch historical budget vs actual expenses
   */
  getBudgetHistory: () => apiFetch('/budget/history', { method: 'GET' }),
};
