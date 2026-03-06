// ============================================================
// services/api.js — Axios instance with JWT interceptor
// ============================================================

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('af_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 globally ────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem('af_token');
      localStorage.removeItem('af_user');
      // Emit a custom event so AuthContext can react without circular imports
      window.dispatchEvent(new CustomEvent('af:unauthorized'));
    }
    return Promise.reject(error);
  },
);

// ── Typed API modules ─────────────────────────────────────────

export const authApi = {
  register:     (data)  => api.post('/auth/register', data),
  login:        (data)  => api.post('/auth/login', data),
  me:           ()      => api.get('/auth/me'),
  acceptInvite: (data)  => api.post('/auth/accept-invite', data),
};

export const employeeApi = {
  list:        (params) => api.get('/employees', { params }),
  get:         (id)     => api.get(`/employees/${id}`),
  update:      (id, d)  => api.put(`/employees/${id}`, d),
  deactivate:  (id)     => api.delete(`/employees/${id}`),
  invite:      (data)   => api.post('/employees/invite', data),
  departments: ()       => api.get('/employees/departments'),
};

export const sessionApi = {
  checkIn:     (data)   => api.post('/sessions/checkin', data),
  checkOut:    (data)   => api.post('/sessions/checkout', data),
  list:        (params) => api.get('/sessions', { params }),
  todayStats:  ()       => api.get('/sessions/today-stats'),
  myStatus:    ()       => api.get('/sessions/my-status'),
};

export const companyApi = {
  get:          ()      => api.get('/company'),
  update:       (data)  => api.put('/company', data),
  getInvites:   ()      => api.get('/company/invites'),
  revokeInvite: (id)    => api.delete(`/company/invites/${id}`),
};

export const reportApi = {
  attendance: (params) => api.get('/reports/attendance', { params }),
  exportCsv:  (params) => api.get('/reports/export/csv', { params, responseType: 'blob' }),
};

export const auditApi = {
  list: (params) => api.get('/audit', { params }),
};

export const superAdminApi = {
  stats:               ()      => api.get('/super-admin/stats'),
  companies:           (p)     => api.get('/super-admin/companies', { params: p }),
  updateCompanyStatus: (id, s) => api.patch(`/super-admin/companies/${id}/status`, { status: s }),
  users:               (p)     => api.get('/super-admin/users', { params: p }),
};

export default api;
