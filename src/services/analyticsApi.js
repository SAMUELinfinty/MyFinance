import { apiFetch, getMemoryToken } from './api';

const API_BASE_URL = '/api/v1';

export const analyticsApi = {
  /**
   * Fetch analytics summary with optional filters
   */
  getSummary: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/analytics/summary${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  /**
   * Trigger CSV download in the browser
   */
  downloadCSV: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = getMemoryToken();
    const url = `${API_BASE_URL}/analytics/export/csv${query ? `?${query}` : ''}`;
    return triggerDownload(url, token, `myfinance_transactions.csv`);
  },

  /**
   * Trigger Excel download in the browser
   */
  downloadExcel: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = getMemoryToken();
    const url = `${API_BASE_URL}/analytics/export/excel${query ? `?${query}` : ''}`;
    return triggerDownload(url, token, `myfinance_transactions.xls`);
  },

  /**
   * Trigger PDF (HTML) report download in the browser
   */
  downloadPDF: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const token = getMemoryToken();
    const url = `${API_BASE_URL}/analytics/export/pdf${query ? `?${query}` : ''}`;
    return triggerDownload(url, token, `myfinance_report.html`);
  },
};

/**
 * Generic authenticated file download helper
 */
async function triggerDownload(url, token, fallbackFilename) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Export failed');
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;

  // Try to extract filename from Content-Disposition
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename=([^;\s]+)/);
    if (match) link.download = match[1];
    else link.download = fallbackFilename;
  } else {
    link.download = fallbackFilename;
  }

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export default analyticsApi;
