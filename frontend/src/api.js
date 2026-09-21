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
    if (error.response?.status === 401) {
      localStorage.removeItem('panchakarma-auth');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
