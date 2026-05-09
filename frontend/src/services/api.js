import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api` 
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (data) => api.post('/auth/google', data),
  getMe: () => api.get('/auth/me'),
};

// Reports endpoints
export const reportsAPI = {
  getAll: (filters) => api.get('/reports', { params: filters }),
  getById: (id) => api.get(`/reports/${id}`),
  create: (data) => api.post('/reports', data),
  updateStatus: (id, data) => api.put(`/reports/${id}/status`, data),
  delete: (id) => api.delete(`/reports/${id}`),
};

// Sessions endpoints
export const sessionsAPI = {
  getAll: () => api.get('/sessions'),
  getById: (id) => api.get(`/sessions/${id}`),
  start: (data) => api.post('/sessions/start', data),
  end: (id) => api.put(`/sessions/${id}/end`),
  pause: (id) => api.put(`/sessions/${id}/pause`),
};

// Stats endpoints
export const statsAPI = {
  getSummary: () => api.get('/stats/summary'),
  getTrends: () => api.get('/stats/trends'),
};

// Live data endpoints
export const liveAPI = {
  sendFrame: (data) => api.post('/live/frame', data),
  sendGPS: (data) => api.post('/live/gps', data),
  sendTelemetry: (data) => api.post('/live/telemetry', data),
};

export default api;
