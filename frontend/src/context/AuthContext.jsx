import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("civicai_token");
      const storedUser = localStorage.getItem("civicai_user");
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to load stored authentication session:", e);
      localStorage.removeItem("civicai_token");
      localStorage.removeItem("civicai_user");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password, asAdmin = false) => {
    try {
      const resp = asAdmin
        ? await authAPI.adminLogin(email, password)
        : await authAPI.login(email, password);

      if (resp.data && resp.data.token) {
        const receivedToken = resp.data.token;
        const receivedUser = resp.data.user;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem("civicai_token", receivedToken);
        localStorage.setItem("civicai_user", JSON.stringify(receivedUser));
        return { success: true, user: receivedUser };
      }
      return { success: false, message: resp.data?.message || "Login failed" };
    } catch (error) {
      const msg = error.response?.data?.message || "Network or server error during login";
      return { success: false, message: msg };
    }
  };

  const register = async (userData) => {
    try {
      const resp = await authAPI.register(userData);
      if (resp.data && resp.data.token) {
        const receivedToken = resp.data.token;
        const receivedUser = resp.data.user;
        setToken(receivedToken);
        setUser(receivedUser);
        localStorage.setItem("civicai_token", receivedToken);
        localStorage.setItem("civicai_user", JSON.stringify(receivedUser));
        return { success: true, user: receivedUser };
      }
      return { success: false, message: resp.data?.message || "Registration failed" };
    } catch (error) {
      const msg = error.response?.data?.message || "Registration failed";
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    authAPI.logout().catch(() => {});
    setToken(null);
    setUser(null);
    localStorage.removeItem("civicai_token");
    localStorage.removeItem("civicai_user");
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem("civicai_user", JSON.stringify(updated));
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === "admin",
    isClient: user?.role === "client",
    login,
    register,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
