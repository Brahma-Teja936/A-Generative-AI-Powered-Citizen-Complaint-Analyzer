import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("civicai_user");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("civicai_token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("civicai_token");
      if (storedToken) {
        try {
          const res = await API.get("/api/auth/me");
          if (res.data.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem("civicai_user", JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn("Session validation failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("civicai_token", newToken);
    localStorage.setItem("civicai_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("civicai_token");
    localStorage.removeItem("civicai_user");
  };

  const updateUser = (updated) => {
    const merged = { ...user, ...updated };
    setUser(merged);
    localStorage.setItem("civicai_user", JSON.stringify(merged));
  };

  const value = {
    user,
    token,
    loading,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === "admin",
    isCitizen: user?.role === "citizen",
    login,
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
