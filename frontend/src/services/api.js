import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json"
  }
});

// Attach Authorization header if token exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("civicai_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor for 401 redirect
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token on authentication failure
      const currentPath = window.location.pathname;
      if (!currentPath.includes("/login") && !currentPath.includes("/register")) {
        localStorage.removeItem("civicai_token");
        localStorage.removeItem("civicai_user");
        if (currentPath.startsWith("/admin")) {
          window.location.href = "/admin/login";
        } else {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authAPI = {
  login: (email, password) => api.post("/auth/login", { email, password }),
  adminLogin: (email, password) => api.post("/admin/login", { email, password }),
  register: (data) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/auth/me")
};

// Client Endpoints
export const clientAPI = {
  getDashboard: () => api.get("/client/dashboard"),
  submitComplaint: (formData) => {
    const isMultipart = formData instanceof FormData;
    return api.post("/client/complaints", formData, {
      headers: isMultipart ? { "Content-Type": "multipart/form-data" } : {}
    });
  },
  getComplaints: (params) => api.get("/client/complaints", { params }),
  getComplaintDetail: (id) => api.get(`/client/complaints/${id}`),
  getNotifications: () => api.get("/client/notifications"),
  markNotificationRead: (id) => api.put(`/client/notifications/${id}/read`),
  getProfile: () => api.get("/client/profile"),
  updateProfile: (data) => api.put("/client/profile", data)
};

// Admin Endpoints
export const adminAPI = {
  getDashboard: () => api.get("/admin/dashboard"),
  getComplaints: (params) => api.get("/admin/complaints", { params }),
  getCriticalComplaints: () => api.get("/admin/complaints/critical"),
  getUrgentComplaints: () => api.get("/admin/complaints/urgent"),
  getComplaintDetail: (id) => api.get(`/admin/complaints/${id}`),
  reanalyzeComplaint: (id) => api.post(`/admin/complaints/${id}/analyze`),
  reviewComplaint: (id) => api.post(`/admin/complaints/${id}/review`),
  saveDecision: (id, data) => api.put(`/admin/complaints/${id}/decision`, data),
  assignDepartment: (id, data) => api.put(`/admin/complaints/${id}/assign`, data),
  updateProgress: (id, data) => api.post(`/admin/complaints/${id}/progress`, data),
  resolveComplaint: (id, data) => api.post(`/admin/complaints/${id}/resolve`, data),
  getAnalytics: () => api.get("/admin/analytics"),
  getDepartments: () => api.get("/admin/departments"),
  createDepartment: (data) => api.post("/admin/departments", data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  getEmailHistory: (params) => api.get("/admin/email-history", { params }),
  retryEmail: (id) => api.post(`/admin/email-history/${id}/retry`),
  getNotifications: () => api.get("/admin/notifications"),
  markNotificationRead: (id) => api.put(`/admin/notifications/${id}/read`),
  getAuditLogs: (params) => api.get("/admin/audit-logs", { params })
};

export default api;