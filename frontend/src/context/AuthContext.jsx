import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('civicai_token');
    const savedUser = localStorage.getItem('civicai_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('civicai_token');
        localStorage.removeItem('civicai_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password, endpoint = '/auth/login') => {
    const res = await api.post(endpoint, { identifier, password });
    const { token: receivedToken, user: receivedUser } = res.data;

    setToken(receivedToken);
    setUser(receivedUser);

    localStorage.setItem('civicai_token', receivedToken);
    localStorage.setItem('civicai_user', JSON.stringify(receivedUser));

    return receivedUser;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { token: receivedToken, user: receivedUser } = res.data;

    setToken(receivedToken);
    setUser(receivedUser);

    localStorage.setItem('civicai_token', receivedToken);
    localStorage.setItem('civicai_user', JSON.stringify(receivedUser));

    return receivedUser;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore logout call errors
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('civicai_token');
      localStorage.removeItem('civicai_user');
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'ADMIN' && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        role: user?.role,
        login,
        register,
        logout,
        hasPermission
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
