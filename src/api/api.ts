// src/api/api.ts
import axios from "axios";

const apiBaseUrl = window.__APP_CONFIG__?.VITE_API_URL || import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  // Skip adding Authorization for validateToken endpoint
  if (token && !config.url?.includes('/api/auth/authenticate')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
