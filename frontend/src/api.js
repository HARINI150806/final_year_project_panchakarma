import axios from 'axios';
import { getStoredAuth } from './auth';

const defaultApiUrl = import.meta.env.PROD
  ? 'https://final-year-project-panchakarma.onrender.com/api'
  : 'http://localhost:8080/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultApiUrl,
});

api.interceptors.request.use((config) => {
  const auth = getStoredAuth();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isPublicAuthRequest = [
      '/auth/login',
      '/auth/register',
      '/auth/send-verification',
      '/auth/forgot-password',
      '/auth/reset-password',
    ].some((path) => requestUrl.includes(path));

    if (error.response?.status === 401 && !isPublicAuthRequest) {
      localStorage.removeItem('panchakarma-auth');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
