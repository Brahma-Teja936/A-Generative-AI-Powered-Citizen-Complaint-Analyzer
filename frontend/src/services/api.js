import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:5000",
  timeout: 30000,
});

// Request interceptor: Attach JWT token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("civicai_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle authorization errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/login") && !currentPath.includes("/register")) {
        localStorage.removeItem("civicai_token");
        localStorage.removeItem("civicai_user");
      }
    }
    return Promise.reject(error);
  }
);

export default API;