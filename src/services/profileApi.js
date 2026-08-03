import { apiFetch } from './api';

const API_BASE_URL = '/api/v1';

export const profileApi = {
  /**
   * Fetch current user profile, financial summary, and health score
   */
  getProfile: () => apiFetch('/profile', { method: 'GET' }),

  /**
   * Update profile details, financial goals, and preferences
   */
  updateProfile: (data) =>
    apiFetch('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  /**
   * Upload user profile avatar image
   * @param {FormData} formData
   */
  uploadAvatar: async (formData) => {
    const memoryToken = (await import('./api')).getMemoryToken();
    const response = await fetch(`${API_BASE_URL}/profile/avatar`, {
      method: 'POST',
      headers: {
        ...(memoryToken ? { Authorization: `Bearer ${memoryToken}` } : {}),
      },
      body: formData,
      credentials: 'include',
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Avatar upload failed');
    }
    return data;
  },

  /**
   * Seed demo transactions for summary & score testing
   */
  seedDemoData: () => apiFetch('/profile/seed-demo', { method: 'POST' }),
};
