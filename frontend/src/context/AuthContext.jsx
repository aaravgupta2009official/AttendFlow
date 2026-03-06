// ============================================================
// context/AuthContext.jsx
// ============================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true while checking stored token

  // ── On mount: validate stored token ────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('af_token');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi.me()
      .then(({ data }) => {
        setUser(data.user);
        if (data.user.companyId) connectSocket(data.user.companyId);
      })
      .catch(() => {
        localStorage.removeItem('af_token');
        localStorage.removeItem('af_user');
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Listen for 401 events from Axios interceptor ────────────
  useEffect(() => {
    const handle = () => logout();
    window.addEventListener('af:unauthorized', handle);
    return () => window.removeEventListener('af:unauthorized', handle);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('af_token', data.token);
    localStorage.setItem('af_user',  JSON.stringify(data.user));
    setUser(data.user);
    if (data.user.companyId) connectSocket(data.user.companyId);
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authApi.register(formData);
    localStorage.setItem('af_token', data.token);
    localStorage.setItem('af_user',  JSON.stringify(data.user));
    setUser(data.user);
    if (data.user.companyId) connectSocket(data.user.companyId);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('af_token');
    localStorage.removeItem('af_user');
    disconnectSocket();
    setUser(null);
  }, []);

  const value = { user, loading, login, register, logout, isAdmin: ['ADMIN','SUPER_ADMIN'].includes(user?.role), isSuperAdmin: user?.role === 'SUPER_ADMIN' };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
