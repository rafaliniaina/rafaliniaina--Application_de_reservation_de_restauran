import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export const AuthContext = createContext(null);

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(err);
  }
);

export { api };

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(r => { setUser(r.data.data); localStorage.setItem('user', JSON.stringify(r.data.data)); })
      .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const saveAuth = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user',  JSON.stringify(userData));
    setUser(userData);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveAuth(data.data.user, data.data.token);
    return data.data;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    saveAuth(data.data.user, data.data.token);
    return data.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const updateUser = useCallback(updated => {
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser,
      isAuthenticated: !!user,
      isClient: user?.role === 'client',
      isOwner:  user?.role === 'owner',
      isAdmin:  user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}