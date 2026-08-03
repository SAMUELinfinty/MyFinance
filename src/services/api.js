const API_BASE_URL = '/api/v1';

let accessTokenInMemory = null;

export const setMemoryToken = (token) => {
  accessTokenInMemory = token;
};

export const getMemoryToken = () => accessTokenInMemory;

/**
 * Custom Fetch wrapper with auto-token refresh & cookie support
 */
export async function apiFetch(endpoint, options = {}) {
  const headers = { ...options.headers };

  // Only set Content-Type for JSON bodies (not FormData)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessTokenInMemory) {
    headers['Authorization'] = `Bearer ${accessTokenInMemory}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Ensure httpOnly refresh token cookies are sent
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch (networkError) {
    const error = new Error('Unable to connect to server. Please check if your backend server is running on port 5000.');
    error.statusCode = 0;
    error.isNetworkError = true;
    throw error;
  }

  // Handle 401 Unauthorized -> Attempt Token Refresh
  if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh-token') {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json().catch(() => null);
        if (refreshData?.data?.accessToken) {
          setMemoryToken(refreshData.data.accessToken);

          // Retry original request with new token
          headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
          response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...config,
            headers,
          });
        }
      } else {
        setMemoryToken(null);
      }
    } catch {
      setMemoryToken(null);
    }
  }

  // Handle Vite proxy / gateway errors (502 Bad Gateway / 504 Gateway Timeout)
  if (response.status === 502 || response.status === 504) {
    const error = new Error('Backend server is offline. Please start the server (cd server && npm run dev).');
    error.statusCode = response.status;
    throw error;
  }

  // Safely parse JSON body
  let data;
  const rawText = await response.text();
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    if (!response.ok) {
      const error = new Error(
        `Server error (${response.status}). Please check server logs.`
      );
      error.statusCode = response.status;
      throw error;
    }
    data = {};
  }

  if (!response.ok) {
    const errorMessage =
      data.message ||
      (response.status === 503
        ? 'Database connection failed. Please ensure MongoDB is running.'
        : `Request failed with status ${response.status}`);

    const error = new Error(errorMessage);
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
