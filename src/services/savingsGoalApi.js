import { apiFetch } from './api';

export const savingsGoalApi = {
  /**
   * Fetch all savings goals with summary stats
   */
  getGoals: () => apiFetch('/savings', { method: 'GET' }),

  /**
   * Create new savings goal
   */
  createGoal: (data) =>
    apiFetch('/savings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Update existing savings goal
   */
  updateGoal: (id, data) =>
    apiFetch(`/savings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Delete savings goal
   */
  deleteGoal: (id) =>
    apiFetch(`/savings/${id}`, {
      method: 'DELETE',
    }),
};
export default savingsGoalApi;
