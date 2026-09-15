import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8000');

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('citypulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('citypulse_token');
      localStorage.removeItem('citypulse_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---- Auth -----------------------------------------------
export const authApi = {
  register: (data: { email: string; full_name: string; password: string; role?: string; phone?: string }) =>
    api.post('/api/auth/register', data),
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  me: () => api.get('/api/auth/me'),
};

// ---- Reports --------------------------------------------
export const reportsApi = {
  create: (formData: FormData) =>
    api.post('/api/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (params?: { status?: string; category?: string; severity?: string; skip?: number; limit?: number }) =>
    api.get('/api/reports', { params }),
  get: (id: number) => api.get(`/api/reports/${id}`),
  update: (id: number, data: object) => api.put(`/api/reports/${id}`, data),
  delete: (id: number) => api.delete(`/api/reports/${id}`),
  updateStatus: (id: number, status: string, note?: string) =>
    api.put(`/api/reports/${id}/status`, { status, note }),
  addNote: (id: number, content: string) =>
    api.post(`/api/reports/${id}/notes`, { content }),
};

// ---- AI -------------------------------------------------
export const aiApi = {
  analyze: (reportId: number) => api.post(`/api/ai/analyze/${reportId}`),
};

// ---- Analytics -----------------------------------------
export const analyticsApi = {
  overview: () => api.get('/api/analytics/overview'),
  categories: () => api.get('/api/analytics/categories'),
  severity: () => api.get('/api/analytics/severity'),
  trends: (days?: number) => api.get('/api/analytics/trends', { params: { days } }),
  hotspots: (limit?: number) => api.get('/api/analytics/hotspots', { params: { limit } }),
  statusDistribution: () => api.get('/api/analytics/status-distribution'),
};

// ---- Helpers --------------------------------------------
export function getImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ');
    return error.message;
  }
  return 'An unexpected error occurred';
}
