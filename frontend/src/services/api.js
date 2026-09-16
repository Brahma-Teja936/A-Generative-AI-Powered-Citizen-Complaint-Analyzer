import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Attach Authorization token to requests if available in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civicai_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401 responses to clear session if expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear localStorage and optionally redirect
      if (localStorage.getItem('civicai_token')) {
        localStorage.removeItem('civicai_token');
        localStorage.removeItem('civicai_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
