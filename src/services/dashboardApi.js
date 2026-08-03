import { apiFetch } from './api';

export const dashboardApi = {
  /**
   * Fetch complete consolidated dashboard summary metrics and statistics
   */
  getSummary: () => apiFetch('/dashboard/summary', { method: 'GET' }),
};
export default dashboardApi;
