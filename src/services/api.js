const API_BASE_URL = 'http://localhost:5000/api/v1';

let accessTokenInMemory = null;

export const setMemoryToken = (token) => {
  accessTokenInMemory = token;
};

export const getMemoryToken = () => accessTokenInMemory;

/**
 * Custom Fetch wrapper with auto-token refresh & cookie support
 */
export async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessTokenInMemory) {
    headers['Authorization'] = `Bearer ${accessTokenInMemory}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Ensure httpOnly refresh token cookies are sent
  };

  let response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Handle 401 Unauthorized -> Attempt Token Refresh
  if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh-token') {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setMemoryToken(refreshData.data.accessToken);

        // Retry original request with new token
        headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...config,
          headers,
        });
      } else {
        setMemoryToken(null);
      }
    } catch {
      setMemoryToken(null);
    }
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'API Request failed');
    error.statusCode = response.status;
    error.errors = data.errors || [];
    throw error;
  }

  return data;
}

export const authApi = {
  register: (userData) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  login: (credentials) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  logout: () => apiFetch('/auth/logout', { method: 'POST' }),
  refreshToken: () => apiFetch('/auth/refresh-token', { method: 'POST' }),
  verifyEmail: (token) => apiFetch(`/auth/verify-email?token=${token}`, { method: 'GET' }),
  forgotPassword: (email) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload) => apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  changePassword: (payload) => apiFetch('/auth/change-password', { method: 'POST', body: JSON.stringify(payload) }),
  googleLogin: (idToken) => apiFetch('/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) }),
  getCurrentUser: () => apiFetch('/auth/me', { method: 'GET' }),
};
